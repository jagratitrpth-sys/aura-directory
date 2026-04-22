import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Pill, ClipboardCheck, Sparkles, Hand } from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import VoiceSearchBar from "@/components/VoiceSearchBar";
import HandStatusBadge from "@/components/HandStatusBadge";
import { useHandRaise } from "@/hooks/useHandRaise";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useDwellSelect } from "@/hooks/useDwellSelect";

type CardKey = "departments" | "medicine" | "checkin";

const CARDS: Array<{
  key: CardKey;
  label: string;
  hint: string;
  Icon: typeof Stethoscope;
  to: string;
  tone: string;
}> = [
  { key: "departments", label: "Find a Department", hint: "Cardiology · Neurology · Pediatrics", Icon: Stethoscope, to: "/departments", tone: "from-primary/10 to-primary/0" },
  { key: "medicine", label: "Medicine Availability", hint: "Stock · Pickup counter · Price", Icon: Pill, to: "/medicine", tone: "from-aurora/10 to-aurora/0" },
  { key: "checkin", label: "Check-in", hint: "Name · Reason · Department", Icon: ClipboardCheck, to: "/checkin", tone: "from-accent/15 to-accent/0" },
];

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [handTrackingOn, setHandTrackingOn] = useState(false);
  const hand = useHandRaise();
  const lastActiveRef = useRef(false);

  const voice = useVoiceInput({
    onFinalResult: (text) => handleQuery(text),
  });

  const handleQuery = (text: string) => {
    const t = text.toLowerCase();
    if (/(department|cardio|neuro|ortho|pediatric|emergency|eye|ophthal|find)/.test(t)) {
      navigate(`/departments?q=${encodeURIComponent(text)}`);
    } else if (/(check[-\s]?in|register|appointment|visit)/.test(t)) {
      navigate("/checkin");
    } else {
      navigate(`/medicine?q=${encodeURIComponent(text)}`);
    }
  };

  // Hand-raise → start voice
  useEffect(() => {
    if (!handTrackingOn) return;
    if (hand.active && !lastActiveRef.current && !voice.listening) voice.start();
    lastActiveRef.current = hand.active;
  }, [hand.active, handTrackingOn, voice]);

  // Convert normalized hand position to viewport pixel cursor
  const cursor = useMemo(() => {
    if (!handTrackingOn || !hand.active || !hand.position) return null;
    return {
      x: hand.position.x * window.innerWidth,
      // HandStatusBadge maps y -> top: y*60+20%
      y: (hand.position.y * 0.6 + 0.2) * window.innerHeight,
    };
  }, [handTrackingOn, hand.active, hand.position]);

  const { register, activeId, progress } = useDwellSelect({
    cursor,
    onSelect: (id) => {
      const card = CARDS.find((c) => c.key === id);
      if (card) navigate(card.to);
    },
  });

  const toggleHand = () => {
    if (handTrackingOn) { hand.stop(); setHandTrackingOn(false); }
    else { hand.start(); setHandTrackingOn(true); }
  };

  const C = 2 * Math.PI * 20;

  return (
    <main className="min-h-screen flex flex-col px-8 md:px-12 py-8 relative">
      <KioskHeader listening={voice.listening} />

      <section className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink">
              Touchless Assistant
            </span>
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-ink leading-[0.95] tracking-tight">
            How can we
            <br />
            <span className="italic text-primary">help you</span> today?
          </h1>
        </div>

        <VoiceSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Say 'Search Paracetamol' or raise your hand to begin."
          onFinalTranscript={handleQuery}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-10 items-stretch">
          {CARDS.map(({ key, label, hint, Icon, to, tone }) => {
            const isActive = activeId === key;
            return (
              <button
                key={key}
                ref={register(key)}
                onClick={() => navigate(to)}
                className={[
                  "relative group rounded-3xl border transition-all duration-300 cursor-pointer",
                  "p-8 flex flex-col items-start justify-between min-h-[220px] text-left overflow-hidden",
                  isActive
                    ? "bg-card border-2 border-primary shadow-glow scale-[1.05] z-10"
                    : "glass border-border shadow-card hover:scale-[1.02] hover:border-primary/50",
                ].join(" ")}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tone} pointer-events-none rounded-3xl`} />
                <Hand className="absolute top-5 right-5 w-6 h-6 text-primary/40" strokeWidth={2} />

                <div className="relative w-14 h-14 rounded-2xl bg-ink flex items-center justify-center">
                  <Icon className="text-ink-foreground w-7 h-7" strokeWidth={2.2} />
                </div>
                <div className="relative mt-6">
                  <h3 className="text-2xl font-serif text-ink leading-tight">{label}</h3>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">{hint}</p>
                </div>

                {isActive && (
                  <>
                    <div className="absolute bottom-6 right-6 w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="4" />
                        <circle
                          cx="24" cy="24" r="20" fill="none"
                          stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={C}
                          strokeDashoffset={C * (1 - progress)}
                          style={{ transition: "stroke-dashoffset 80ms linear" }}
                        />
                      </svg>
                    </div>
                    <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-mint text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-card">
                      Selecting · {Math.round(progress * 100)}%
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground text-center">
          ✋ Center hand on a card 2s to select · 🎙 Raise hand to start listening
        </p>
      </section>

      <HandStatusBadge
        enabled={handTrackingOn}
        onToggle={toggleHand}
        active={hand.active}
        confidence={hand.confidence}
        position={hand.position}
        error={hand.error}
      />
    </main>
  );
};

export default Index;
