import { useEffect, useRef, useState } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Loader2, Bot } from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { supabase } from "@/integrations/supabase/client";

type Msg = { id?: string; role: "user" | "assistant"; content: string };

const SESSION_KEY = "kiosk-chat-session-id";

const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const Chat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getSessionId());

  const voice = useVoiceInput({
    onFinalResult: (text) => {
      setInput(text);
      // small delay so user sees text, then send
      setTimeout(() => sendMessage(text), 250);
    },
  });

  // Load history
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content")
        .eq("session_id", sessionId.current)
        .order("created_at", { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      if (data && data.length > 0) {
        setMessages(data as Msg[]);
      } else {
        setMessages([
          { role: "assistant", content: "Hi! I'm your kiosk assistant. Ask me about departments, medicines, or check-in." },
        ]);
      }
    })();
  }, []);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Keep input focused
  useEffect(() => {
    if (!streaming) inputRef.current?.focus();
  }, [streaming, messages.length]);

  const speak = (text: string) => {
    if (!ttsOn || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (err) {
      console.warn("tts failed", err);
    }
  };

  const persist = async (role: "user" | "assistant", content: string) => {
    await supabase.from("chat_messages").insert({
      session_id: sessionId.current,
      role,
      content,
    });
  };

  const sendMessage = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setStreaming(true);
    persist("user", text);

    try {
      const url = `https://lepcqaeuiapphtlbezpq.supabase.co/functions/v1/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: "Rate limit", description: "Too many requests. Please wait a moment.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "AI credits exhausted", description: "Add credits in Lovable Cloud to continue.", variant: "destructive" });
        } else {
          toast({ title: "Chat failed", description: `Status ${resp.status}`, variant: "destructive" });
        }
        setMessages((m) => m.slice(0, -1));
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (assistant) {
        persist("assistant", assistant);
        speak(assistant);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Network error", description: String(err), variant: "destructive" });
      setMessages((m) => m.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const toggleMic = () => {
    if (voice.listening) voice.stop();
    else voice.start();
  };

  return (
    <main className="min-h-screen flex flex-col px-6 md:px-12 py-6">
      <KioskHeader showBack listening={voice.listening} />

      <section className="flex-1 flex flex-col max-w-3xl w-full mx-auto mt-6 min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center">
              <Bot className="w-5 h-5 text-ink-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-ink leading-tight">Kiosk Assistant</h1>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Two-way voice + text chat
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTtsOn((v) => !v);
              if (ttsOn) window.speechSynthesis?.cancel();
            }}
            aria-label={ttsOn ? "Mute spoken replies" : "Enable spoken replies"}
          >
            {ttsOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="ml-2 text-xs font-mono uppercase tracking-wider">
              {ttsOn ? "Voice on" : "Voice off"}
            </span>
          </Button>
        </div>

        <ScrollArea className="flex-1 rounded-3xl glass border border-border p-5 min-h-[400px]">
          <div ref={scrollRef} className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={[
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-ink text-ink-foreground rounded-br-sm"
                      : "bg-card text-ink border border-border rounded-bl-sm",
                  ].join(" ")}
                >
                  {m.content || (streaming && i === messages.length - 1 ? (
                    <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                  ) : null)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mt-4 flex items-center gap-2"
        >
          <Button
            type="button"
            variant={voice.listening ? "default" : "outline"}
            size="icon"
            onClick={toggleMic}
            disabled={!voice.supported || streaming}
            aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
            className="rounded-2xl h-12 w-12 shrink-0"
          >
            {voice.listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voice.listening ? "Listening…" : "Type your question or tap the mic"}
            className="h-12 rounded-2xl text-base"
            disabled={streaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={streaming || !input.trim()}
            className="rounded-2xl h-12 w-12 shrink-0"
            aria-label="Send"
          >
            {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>

        {voice.error && (
          <p className="mt-2 text-xs text-destructive font-mono">
            Mic: {voice.error}
          </p>
        )}
      </section>
    </main>
  );
};

export default Chat;
