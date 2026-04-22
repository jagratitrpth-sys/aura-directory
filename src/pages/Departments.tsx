import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart, Brain, Bone, Baby, Eye, Stethoscope, Activity, Pill, Hand, MapPin, CheckCircle2,
} from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import VoiceSearchBar from "@/components/VoiceSearchBar";

type Department = {
  name: string;
  category: string;
  floor: string;
  wing: string;
  Icon: typeof Heart;
};

const DEPARTMENTS: Department[] = [
  { name: "Cardiology", category: "Specialty", floor: "3rd Floor", wing: "East Wing", Icon: Heart },
  { name: "Neurology", category: "Specialty", floor: "4th Floor", wing: "West Wing", Icon: Brain },
  { name: "Orthopedics", category: "Specialty", floor: "2nd Floor", wing: "North Wing", Icon: Bone },
  { name: "Pediatrics", category: "General", floor: "1st Floor", wing: "South Wing", Icon: Baby },
  { name: "Ophthalmology", category: "Specialty", floor: "2nd Floor", wing: "East Wing", Icon: Eye },
  { name: "General Medicine", category: "General", floor: "1st Floor", wing: "Main Lobby", Icon: Stethoscope },
  { name: "Emergency", category: "Emergency", floor: "Ground Floor", wing: "Main Entrance", Icon: Activity },
  { name: "Pharmacy", category: "General", floor: "Ground Floor", wing: "South Wing", Icon: Pill },
];

const CATEGORIES = ["All", "General", "Specialty", "Emergency"] as const;

const Departments = () => {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [selected, setSelected] = useState<Department | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = params.get("q");
    if (q) setQuery(q);
  }, [params]);

  const filtered = useMemo(() => {
    return DEPARTMENTS.filter((d) => {
      const matchCat = category === "All" || d.category === category;
      const matchQ = d.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [query, category]);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setSelected(null);
      navigate("/");
    }, 1800);
  };

  return (
    <main className="min-h-screen flex flex-col px-8 md:px-12 py-8">
      <KioskHeader showBack />

      <section className="flex-1 max-w-6xl mx-auto w-full mt-10 animate-fade-in">
        <div className="text-center mb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            Find a Department
          </span>
          <h1 className="text-4xl md:text-6xl font-serif text-ink tracking-tight mt-2">
            Where would you like to go?
          </h1>
        </div>

        <VoiceSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Say or type a department name…"
        />

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={[
                  "px-5 py-2 rounded-full font-mono text-[11px] uppercase tracking-widest transition-all border",
                  active
                    ? "bg-ink text-ink-foreground border-ink shadow-card scale-105"
                    : "glass text-ink border-border hover:border-ink/40",
                ].join(" ")}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {filtered.map((d) => {
            const Icon = d.Icon;
            return (
              <button
                key={d.name}
                onClick={() => setSelected(d)}
                className="group relative rounded-2xl glass p-6 text-left shadow-card hover:scale-[1.04] hover:border-primary/60 transition-all duration-300 border border-border"
              >
                <Hand className="absolute top-4 right-4 w-5 h-5 text-primary/30" />
                <div className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center mb-5 group-hover:bg-gradient-mint transition-colors">
                  <Icon className="w-6 h-6 text-ink-foreground" strokeWidth={2.4} />
                </div>
                <h3 className="text-xl font-serif text-ink leading-tight">{d.name}</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1.5">
                  {d.floor} · {d.wing}
                </p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12 font-medium">
              No departments match your search.
            </p>
          )}
        </div>
      </section>

      {/* Tap to confirm modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in p-6">
          <div className="bg-card rounded-3xl shadow-glow border-2 border-primary max-w-md w-full p-8 text-center">
            {confirmed ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-mint mx-auto flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-serif text-ink">Directions sent!</h2>
                <p className="text-muted-foreground font-medium mt-2">
                  Follow the floor signs to {selected.name}.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-gradient-ink mx-auto flex items-center justify-center mb-5">
                  <selected.Icon className="w-10 h-10 text-ink-foreground" strokeWidth={2.4} />
                </div>
                <h2 className="text-4xl font-serif text-ink tracking-tight">{selected.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{selected.floor} · {selected.wing}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-6 mb-5 uppercase tracking-widest">
                  ✋ Tap or hold hand to confirm
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 py-4 rounded-2xl bg-secondary text-secondary-foreground font-bold border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-bold shadow-card hover:opacity-95 transition-opacity"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Departments;
