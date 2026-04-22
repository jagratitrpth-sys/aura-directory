import { useMemo, useState } from "react";
import { Search, Pill, Hand, MapPin, CheckCircle2, AlertCircle, XCircle, Package } from "lucide-react";
import KioskHeader from "@/components/KioskHeader";

type Stock = "in" | "low" | "out";

type Medicine = {
  name: string;
  generic: string;
  stock: Stock;
  units: number;
  pharmacy: string;
  counter: string;
  price: string;
};

const MEDICINES: Medicine[] = [
  { name: "Paracetamol", generic: "Acetaminophen 500mg", stock: "in", units: 248, pharmacy: "Main Pharmacy", counter: "Counter 3 · Ground Floor", price: "$2.50" },
  { name: "Ibuprofen", generic: "Ibuprofen 400mg", stock: "in", units: 156, pharmacy: "Main Pharmacy", counter: "Counter 1 · Ground Floor", price: "$3.20" },
  { name: "Amoxicillin", generic: "Amoxicillin 500mg", stock: "low", units: 12, pharmacy: "Outpatient Pharmacy", counter: "Counter 2 · 1st Floor", price: "$8.40" },
  { name: "Metformin", generic: "Metformin HCl 850mg", stock: "in", units: 320, pharmacy: "Main Pharmacy", counter: "Counter 4 · Ground Floor", price: "$5.10" },
  { name: "Aspirin", generic: "Acetylsalicylic Acid 75mg", stock: "in", units: 410, pharmacy: "Main Pharmacy", counter: "Counter 2 · Ground Floor", price: "$1.90" },
  { name: "Insulin Glargine", generic: "Lantus 100 IU/ml", stock: "low", units: 6, pharmacy: "Specialty Pharmacy", counter: "Counter 1 · 2nd Floor", price: "$42.00" },
  { name: "Salbutamol Inhaler", generic: "Albuterol 100mcg", stock: "out", units: 0, pharmacy: "Outpatient Pharmacy", counter: "Counter 3 · 1st Floor", price: "$11.75" },
  { name: "Omeprazole", generic: "Omeprazole 20mg", stock: "in", units: 188, pharmacy: "Main Pharmacy", counter: "Counter 5 · Ground Floor", price: "$4.30" },
];

const stockMeta: Record<Stock, { label: string; Icon: typeof CheckCircle2; classes: string; dot: string }> = {
  in: { label: "In Stock", Icon: CheckCircle2, classes: "bg-primary/10 text-primary", dot: "bg-primary" },
  low: { label: "Low Stock", Icon: AlertCircle, classes: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  out: { label: "Out of Stock", Icon: XCircle, classes: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const Medicine = () => {
  const [query, setQuery] = useState("Paracetamol");
  const [selected, setSelected] = useState<Medicine | null>(null);

  const filtered = useMemo(
    () =>
      MEDICINES.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.generic.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const featured = filtered[0];

  return (
    <main className="min-h-screen flex flex-col px-10 py-8 animate-fade-in">
      <KioskHeader showBack />

      <section className="flex-1 max-w-6xl mx-auto w-full mt-10">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.3em] mb-2">
            Medicine Availability
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Search the hospital pharmacy
          </h1>
        </div>

        {/* Search */}
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute inset-0 bg-gradient-teal opacity-15 blur-2xl rounded-full" />
          <div className="relative flex items-center gap-4 bg-card border border-border rounded-2xl px-6 py-4 shadow-card">
            <Search className="w-6 h-6 text-primary shrink-0" strokeWidth={2.5} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by medicine name or generic..."
              className="flex-1 bg-transparent outline-none text-lg text-foreground placeholder:text-muted-foreground font-medium"
            />
            <Hand className="w-5 h-5 text-primary/40" />
          </div>
        </div>

        {/* Featured result */}
        {featured && (
          <div className="mt-8 rounded-3xl bg-card border-2 border-primary shadow-glow p-8 grid md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-5 md:col-span-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-teal flex items-center justify-center shrink-0">
                <Pill className="w-10 h-10 text-primary-foreground" strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{featured.name}</h2>
                <p className="text-muted-foreground font-medium mt-1">{featured.generic}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${stockMeta[featured.stock].classes}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stockMeta[featured.stock].dot} ${featured.stock !== "out" ? "animate-mic-pulse" : ""}`} />
                    {stockMeta[featured.stock].label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    <Package className="w-4 h-4 inline mr-1 text-primary" />
                    {featured.units} units available
                  </span>
                  <span className="text-sm font-semibold text-foreground">{featured.price}</span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/60 rounded-2xl p-5 border border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Pickup Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{featured.pharmacy}</p>
                  <p className="text-sm text-muted-foreground font-medium">{featured.counter}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {filtered.slice(1).map((m) => {
            const meta = stockMeta[m.stock];
            return (
              <button
                key={m.name}
                onClick={() => setSelected(m)}
                className="group relative text-left bg-card border border-border rounded-2xl p-5 shadow-card hover:scale-[1.02] hover:border-primary transition-all"
              >
                <Hand className="absolute top-4 right-4 w-5 h-5 text-primary/30" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-gradient-teal transition-colors">
                    <Pill className="w-6 h-6 text-primary group-hover:text-primary-foreground" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{m.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium truncate">{m.generic}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{m.pharmacy}</span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12 font-medium">
              No medicines match your search.
            </p>
          )}
        </div>
      </section>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in p-6" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-3xl shadow-glow border-2 border-primary max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-teal mx-auto flex items-center justify-center mb-5">
              <Pill className="w-10 h-10 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight text-center">{selected.name}</h2>
            <p className="text-muted-foreground font-medium text-center mt-1">{selected.generic}</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-4 py-3 border border-border">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stock</span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${stockMeta[selected.stock].classes}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stockMeta[selected.stock].dot}`} />
                  {stockMeta[selected.stock].label} · {selected.units}
                </span>
              </div>
              <div className="bg-secondary/60 rounded-xl px-4 py-3 border border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Pickup</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">{selected.pharmacy}</p>
                    <p className="text-sm text-muted-foreground font-medium">{selected.counter}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-teal text-primary-foreground font-bold shadow-card hover:opacity-95 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Medicine;
