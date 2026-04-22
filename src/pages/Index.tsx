import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Pill, ClipboardCheck, Sparkles } from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import VoiceSearchBar from "@/components/VoiceSearchBar";
import DwellCard from "@/components/DwellCard";
import HandStatusBadge from "@/components/HandStatusBadge";
import { useHandRaise } from "@/hooks/useHandRaise";
import { useVoiceInput } from "@/hooks/useVoiceInput";

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
    onFinalResult: (text) => {
      handleQuery(text);
    },
  });

  const handleQuery = (text: string) => {
    const t = text.toLowerCase();
    if (/(department|cardio|neuro|ortho|pediatric|emergency|eye|ophthal|find)/.test(t)) {
      navigate(`/departments?q=${encodeURIComponent(text)}`);
    } else if (/(check[-\s]?in|register|appointment|visit)/.test(t)) {
      navigate("/checkin");
    } else {
      // Default: treat as medicine search
      navigate(`/medicine?q=${encodeURIComponent(text)}`);
    }
  };

  // Hand-raise trigger for voice
  useEffect(() => {
    if (!handTrackingOn) return;
    if (hand.active && !lastActiveRef.current && !voice.listening) {
      voice.start();
    }
    lastActiveRef.current = hand.active;
  }, [hand.active, handTrackingOn, voice]);

  // Determine which card the hand is currently over (3 vertical columns)
  const hoveredCard: CardKey | null = useMemo(() => {
    if (!handTrackingOn || !hand.active || !hand.position) return null;
    const x = hand.position.x;
    if (x < 0.34) return "departments";
    if (x < 0.67) return "medicine";
    return "checkin";
  }, [handTrackingOn, hand.active, hand.position]);

  const toggleHand = () => {
    if (handTrackingOn) {
      hand.stop();
      setHandTrackingOn(false);
    } else {
      hand.start();
      setHandTrackingOn(true);
    }
  };

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

        {/* Action grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-10 items-stretch">
          {CARDS.map(({ key, label, hint, Icon, to, tone }) => {
            const isHover = hoveredCard === key;
            return (
              <DwellCard
                key={key}
                hovered={isHover}
                onSelect={() => navigate(to)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tone} pointer-events-none rounded-3xl`} />
                <div className="relative w-14 h-14 rounded-2xl bg-ink flex items-center justify-center">
                  <Icon className="text-ink-foreground w-7 h-7" strokeWidth={2.2} />
                </div>
                <div className="relative mt-6">
                  <h3 className="text-2xl font-serif text-ink leading-tight">{label}</h3>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">{hint}</p>
                </div>
              </DwellCard>
            );
          })}
        </div>

        <p className="mt-8 text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground text-center">
          ✋ Hold over a card 2s to select · 🎙 Raise hand to start listening
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
