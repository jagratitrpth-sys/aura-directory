import { Mic, Hand, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface KioskHeaderProps {
  showBack?: boolean;
  listening?: boolean;
}

const KioskHeader = ({ showBack = false, listening = false }: KioskHeaderProps) => {
  const [time, setTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    update();
    const id = setInterval(update, 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate("/")}
            className="w-12 h-12 rounded-2xl glass flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2.5} />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-ink flex items-center justify-center">
            <span className="font-serif text-2xl text-ink-foreground leading-none">M</span>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold text-ink tracking-tight">MediCare</p>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Aurora · Kiosk v3</p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        {listening && (
          <>
            <span className="absolute w-16 h-16 rounded-full bg-primary/30 animate-ring-pulse" />
            <span className="absolute w-16 h-16 rounded-full bg-primary/20 animate-ring-pulse [animation-delay:0.8s]" />
          </>
        )}
        <div
          className={[
            "relative w-14 h-14 rounded-full flex items-center justify-center transition-all",
            listening ? "bg-gradient-mint shadow-glow animate-mic-pulse" : "bg-ink",
          ].join(" ")}
        >
          <Mic className="w-6 h-6 text-ink-foreground" strokeWidth={2.5} />
        </div>
        <span className="ml-3 font-mono text-[11px] uppercase tracking-widest text-ink hidden md:inline">
          {listening ? "Listening" : "Idle"}
        </span>
      </div>

      <div className="flex items-center gap-3 glass px-4 py-2.5 rounded-2xl">
        <Hand className="w-5 h-5 text-primary animate-wave origin-bottom" strokeWidth={2.2} />
        <span className="font-mono text-xl font-semibold text-ink tabular-nums tracking-tight">{time}</span>
      </div>
    </header>
  );
};

export default KioskHeader;
