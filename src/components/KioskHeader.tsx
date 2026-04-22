import { Mic, Hand, Cross, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface KioskHeaderProps {
  showBack?: boolean;
}

const KioskHeader = ({ showBack = false }: KioskHeaderProps) => {
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
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate("/")}
            className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-card hover:bg-secondary transition-colors mr-1"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-6 h-6 text-primary" strokeWidth={2.5} />
          </button>
        )}
        <div className="w-14 h-14 rounded-2xl bg-gradient-teal flex items-center justify-center shadow-card">
          <Cross className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="text-xl font-bold text-primary tracking-tight">MediCare</p>
          <p className="text-sm text-muted-foreground font-medium">Hospital Directory</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <span className="absolute w-20 h-20 rounded-full bg-primary/30 animate-ring-pulse" />
        <span className="absolute w-20 h-20 rounded-full bg-primary/20 animate-ring-pulse [animation-delay:1s]" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-teal flex items-center justify-center shadow-card animate-mic-pulse">
          <Mic className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="ml-4 text-sm font-semibold text-primary uppercase tracking-widest hidden md:inline">
          Listening
        </span>
      </div>

      <div className="flex items-center gap-4 bg-card/80 backdrop-blur px-5 py-3 rounded-2xl shadow-card border border-border">
        <Hand className="w-6 h-6 text-primary animate-wave origin-bottom" strokeWidth={2.2} />
        <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{time}</span>
      </div>
    </header>
  );
};

export default KioskHeader;
