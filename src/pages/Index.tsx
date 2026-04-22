import { Search, Stethoscope, Pill, ClipboardCheck, Hand } from "lucide-react";
import { Link } from "react-router-dom";
import KioskHeader from "@/components/KioskHeader";

const Index = () => {
  const cards = [
    {
      label: "Find a Department",
      Icon: Stethoscope,
      active: false,
      to: "/departments",
    },
    {
      label: "Medicine Availability",
      Icon: Pill,
      active: true,
      to: "/medicine",
    },
    {
      label: "Check-in",
      Icon: ClipboardCheck,
      active: false,
      to: "/",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col px-10 py-8 animate-fade-in">
      <KioskHeader />

      <section className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full -mt-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.3em] mb-3">
            Touchless Assistant
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            How can we help you today?
          </h1>
        </div>

        {/* Search bar */}
        <div className="w-full max-w-3xl relative group">
          <div className="absolute inset-0 bg-gradient-teal opacity-20 blur-2xl rounded-full" />
          <div className="relative flex items-center gap-4 bg-card border border-border rounded-2xl px-6 py-5 shadow-card">
            <Search className="w-7 h-7 text-primary shrink-0" strokeWidth={2.5} />
            <input
              readOnly
              placeholder="Say 'Search Paracetamol' or raise your hand to begin."
              className="flex-1 bg-transparent outline-none text-lg md:text-xl text-foreground placeholder:text-muted-foreground font-medium"
            />
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary animate-mic-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>

        {/* Action grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 items-stretch">
          {cards.map(({ label, Icon, active, to }) => (
            <Link
              key={label}
              to={to}
              className={[
                "relative group rounded-3xl bg-card border transition-all duration-300 cursor-pointer",
                "p-8 flex flex-col items-start justify-between min-h-[220px]",
                active
                  ? "border-primary border-2 shadow-glow scale-[1.06] z-10 animate-glow-pulse"
                  : "border-border shadow-card hover:scale-[1.02] hover:border-primary/50",
              ].join(" ")}
            >
              <Hand className="absolute top-5 right-5 w-6 h-6 text-primary/40" strokeWidth={2} />

              <div
                className={[
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  active ? "bg-gradient-teal" : "bg-primary/10",
                ].join(" ")}
              >
                <Icon
                  className={active ? "text-primary-foreground w-7 h-7" : "text-primary w-7 h-7"}
                  strokeWidth={2.4}
                />
              </div>

              <div className="flex items-end justify-between w-full mt-6">
                <h3 className="text-2xl font-bold text-foreground tracking-tight leading-tight max-w-[70%]">
                  {label}
                </h3>

                {active && (
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-12 h-12 -rotate-90 animate-spin-slow" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="4" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        strokeDashoffset="75"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {active && (
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-card">
                  Selecting…
                </span>
              )}
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground font-medium">
          ✋ Hold your hand over a card for 2 seconds to select · 🎙 Or speak your request aloud
        </p>
      </section>
    </main>
  );
};

export default Index;
