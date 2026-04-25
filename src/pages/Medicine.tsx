import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, Hand, MapPin, CheckCircle2, AlertCircle, XCircle, Package, Clock, Utensils, AlertTriangle, FileText, X } from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import VoiceSearchBar, { type SearchSuggestion } from "@/components/VoiceSearchBar";
import { fuzzySearch } from "@/lib/fuzzyMatch";

type Stock = "in" | "low" | "out";

type Medicine = {
  name: string;
  generic: string;
  stock: Stock;
  units: number;
  pharmacy: string;
  counter: string;
  price: string;
  form: string;
  strength: string;
  dosage: string;
  frequency: string;
  withFood: string;
  warnings: string;
  prescription: boolean;
};

const MEDICINES: Medicine[] = [
  { name: "Paracetamol", generic: "Acetaminophen 500mg", stock: "in", units: 248, pharmacy: "Main Pharmacy", counter: "Counter 3 · Ground Floor", price: "$2.50", form: "Tablet", strength: "500 mg", dosage: "1–2 tablets", frequency: "Every 4–6 hours, max 8/day", withFood: "With or without food", warnings: "Avoid alcohol. Do not exceed 4g per day.", prescription: false },
  { name: "Ibuprofen", generic: "Ibuprofen 400mg", stock: "in", units: 156, pharmacy: "Main Pharmacy", counter: "Counter 1 · Ground Floor", price: "$3.20", form: "Tablet", strength: "400 mg", dosage: "1 tablet", frequency: "Every 6–8 hours, max 3/day", withFood: "Take with food", warnings: "May cause stomach upset. Avoid if pregnant.", prescription: false },
  { name: "Amoxicillin", generic: "Amoxicillin 500mg", stock: "low", units: 12, pharmacy: "Outpatient Pharmacy", counter: "Counter 2 · 1st Floor", price: "$8.40", form: "Capsule", strength: "500 mg", dosage: "1 capsule", frequency: "Every 8 hours for 7 days", withFood: "With or without food", warnings: "Complete full course. Allergic reaction risk.", prescription: true },
  { name: "Metformin", generic: "Metformin HCl 850mg", stock: "in", units: 320, pharmacy: "Main Pharmacy", counter: "Counter 4 · Ground Floor", price: "$5.10", form: "Tablet", strength: "850 mg", dosage: "1 tablet", frequency: "Twice daily", withFood: "Take with meals", warnings: "Monitor kidney function. Avoid alcohol.", prescription: true },
  { name: "Aspirin", generic: "Acetylsalicylic Acid 75mg", stock: "in", units: 410, pharmacy: "Main Pharmacy", counter: "Counter 2 · Ground Floor", price: "$1.90", form: "Tablet", strength: "75 mg", dosage: "1 tablet", frequency: "Once daily", withFood: "Take with food", warnings: "Not for under 16. Bleeding risk.", prescription: false },
  { name: "Insulin Glargine", generic: "Lantus 100 IU/ml", stock: "low", units: 6, pharmacy: "Specialty Pharmacy", counter: "Counter 1 · 2nd Floor", price: "$42.00", form: "Injection", strength: "100 IU/ml", dosage: "As prescribed", frequency: "Once daily, same time", withFood: "Independent of meals", warnings: "Refrigerate. Rotate injection sites.", prescription: true },
  { name: "Salbutamol Inhaler", generic: "Albuterol 100mcg", stock: "out", units: 0, pharmacy: "Outpatient Pharmacy", counter: "Counter 3 · 1st Floor", price: "$11.75", form: "Inhaler", strength: "100 mcg/puff", dosage: "1–2 puffs", frequency: "Every 4–6 hours as needed", withFood: "N/A", warnings: "Shake well. Rinse mouth after use.", prescription: true },
  { name: "Omeprazole", generic: "Omeprazole 20mg", stock: "in", units: 188, pharmacy: "Main Pharmacy", counter: "Counter 5 · Ground Floor", price: "$4.30", form: "Capsule", strength: "20 mg", dosage: "1 capsule", frequency: "Once daily", withFood: "Before breakfast", warnings: "Long-term use may affect bone density.", prescription: false },
  { name: "Atorvastatin", generic: "Atorvastatin 20mg", stock: "in", units: 142, pharmacy: "Main Pharmacy", counter: "Counter 3 · Ground Floor", price: "$6.80", form: "Tablet", strength: "20 mg", dosage: "1 tablet", frequency: "Once daily, evening", withFood: "With or without food", warnings: "Report muscle pain. Avoid grapefruit.", prescription: true },
  { name: "Amlodipine", generic: "Amlodipine 5mg", stock: "in", units: 220, pharmacy: "Main Pharmacy", counter: "Counter 4 · Ground Floor", price: "$3.50", form: "Tablet", strength: "5 mg", dosage: "1 tablet", frequency: "Once daily", withFood: "With or without food", warnings: "May cause ankle swelling.", prescription: true },
  { name: "Losartan", generic: "Losartan Potassium 50mg", stock: "in", units: 175, pharmacy: "Main Pharmacy", counter: "Counter 4 · Ground Floor", price: "$4.90", form: "Tablet", strength: "50 mg", dosage: "1 tablet", frequency: "Once daily", withFood: "With or without food", warnings: "Avoid in pregnancy. Monitor potassium.", prescription: true },
  { name: "Levothyroxine", generic: "Levothyroxine 50mcg", stock: "low", units: 18, pharmacy: "Specialty Pharmacy", counter: "Counter 2 · 2nd Floor", price: "$7.20", form: "Tablet", strength: "50 mcg", dosage: "1 tablet", frequency: "Once daily, morning", withFood: "Empty stomach, 30 min before food", warnings: "Take consistently at the same time.", prescription: true },
  { name: "Azithromycin", generic: "Azithromycin 250mg", stock: "in", units: 96, pharmacy: "Outpatient Pharmacy", counter: "Counter 2 · 1st Floor", price: "$9.60", form: "Tablet", strength: "250 mg", dosage: "2 tablets day 1, then 1", frequency: "Once daily for 5 days", withFood: "With or without food", warnings: "Complete full course. May cause diarrhea.", prescription: true },
  { name: "Ciprofloxacin", generic: "Ciprofloxacin 500mg", stock: "out", units: 0, pharmacy: "Outpatient Pharmacy", counter: "Counter 1 · 1st Floor", price: "$10.20", form: "Tablet", strength: "500 mg", dosage: "1 tablet", frequency: "Twice daily for 7–14 days", withFood: "With or without food", warnings: "Avoid dairy near dose. Tendon risk.", prescription: true },
  { name: "Cetirizine", generic: "Cetirizine HCl 10mg", stock: "in", units: 305, pharmacy: "Main Pharmacy", counter: "Counter 5 · Ground Floor", price: "$1.40", form: "Tablet", strength: "10 mg", dosage: "1 tablet", frequency: "Once daily", withFood: "With or without food", warnings: "May cause drowsiness.", prescription: false },
  { name: "Loratadine", generic: "Loratadine 10mg", stock: "in", units: 268, pharmacy: "Main Pharmacy", counter: "Counter 5 · Ground Floor", price: "$2.10", form: "Tablet", strength: "10 mg", dosage: "1 tablet", frequency: "Once daily", withFood: "With or without food", warnings: "Generally non-drowsy.", prescription: false },
  { name: "Pantoprazole", generic: "Pantoprazole 40mg", stock: "in", units: 134, pharmacy: "Main Pharmacy", counter: "Counter 5 · Ground Floor", price: "$5.60", form: "Tablet", strength: "40 mg", dosage: "1 tablet", frequency: "Once daily", withFood: "Before breakfast", warnings: "Swallow whole, do not crush.", prescription: false },
  { name: "Diclofenac Gel", generic: "Diclofenac 1% topical", stock: "low", units: 9, pharmacy: "Outpatient Pharmacy", counter: "Counter 4 · 1st Floor", price: "$6.00", form: "Topical Gel", strength: "1%", dosage: "2–4 g to affected area", frequency: "3–4 times daily", withFood: "N/A — external use", warnings: "Do not apply to broken skin.", prescription: false },
  { name: "Vitamin D3", generic: "Cholecalciferol 1000 IU", stock: "in", units: 540, pharmacy: "Main Pharmacy", counter: "Counter 6 · Ground Floor", price: "$3.80", form: "Soft Gel", strength: "1000 IU", dosage: "1 capsule", frequency: "Once daily", withFood: "Take with a fatty meal", warnings: "Do not exceed 4000 IU/day.", prescription: false },
  { name: "Warfarin", generic: "Warfarin Sodium 5mg", stock: "low", units: 14, pharmacy: "Specialty Pharmacy", counter: "Counter 1 · 2nd Floor", price: "$8.90", form: "Tablet", strength: "5 mg", dosage: "As prescribed (INR-based)", frequency: "Once daily, same time", withFood: "With or without food", warnings: "Regular INR tests. Avoid vitamin K spikes.", prescription: true },
];

const stockMeta: Record<Stock, { label: string; Icon: typeof CheckCircle2; classes: string; dot: string }> = {
  in: { label: "In Stock", Icon: CheckCircle2, classes: "bg-primary/10 text-primary", dot: "bg-primary" },
  low: { label: "Low Stock", Icon: AlertCircle, classes: "bg-accent/15 text-accent-foreground", dot: "bg-accent" },
  out: { label: "Out of Stock", Icon: XCircle, classes: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const Medicine = () => {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "Paracetamol");
  const [selected, setSelected] = useState<Medicine | null>(null);

  useEffect(() => {
    const q = params.get("q");
    if (q) setQuery(q);
  }, [params]);

  const filtered = useMemo(
    () =>
      fuzzySearch(MEDICINES, query, (m) => [m.name, m.generic]).map((r) => r.item),
    [query]
  );

  const suggestions: SearchSuggestion[] = useMemo(
    () =>
      filtered.slice(0, 6).map((m) => ({
        id: m.name,
        label: m.name,
        hint: `${m.generic} · ${stockMeta[m.stock].label}`,
      })),
    [filtered]
  );

  const featured = filtered[0];

  return (
    <main className="min-h-screen flex flex-col px-8 md:px-12 py-8">
      <KioskHeader showBack />

      <section className="flex-1 max-w-6xl mx-auto w-full mt-10 animate-fade-in">
        <div className="text-center mb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            Medicine Availability
          </span>
          <h1 className="text-4xl md:text-6xl font-serif text-ink tracking-tight mt-2">
            Search the hospital pharmacy
          </h1>
        </div>

        <VoiceSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by medicine name or generic…"
          suggestions={suggestions}
          onSuggestionSelect={(s) => {
            const found = MEDICINES.find((m) => m.name === s.id);
            if (found) setSelected(found);
          }}
        />

        {/* Featured result */}
        {featured && (
          <button
            onClick={() => setSelected(featured)}
            className="mt-8 w-full text-left rounded-3xl bg-card border-2 border-primary shadow-glow p-8 grid md:grid-cols-3 gap-6 items-center hover:scale-[1.01] transition-transform"
            aria-label={`View details for ${featured.name}`}
          >
            <div className="flex items-center gap-5 md:col-span-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-mint flex items-center justify-center shrink-0">
                <Pill className="w-10 h-10 text-primary-foreground" strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-4xl font-serif text-ink tracking-tight">{featured.name}</h2>
                <p className="text-muted-foreground font-medium mt-1">{featured.generic}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${stockMeta[featured.stock].classes}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stockMeta[featured.stock].dot} ${featured.stock !== "out" ? "animate-mic-pulse" : ""}`} />
                    {stockMeta[featured.stock].label}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    <Package className="w-4 h-4 inline mr-1 text-primary" />
                    {featured.units} units
                  </span>
                  <span className="font-mono text-sm text-ink">{featured.price}</span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/60 rounded-2xl p-5 border border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">Pickup Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-ink">{featured.pharmacy}</p>
                  <p className="text-sm text-muted-foreground font-medium">{featured.counter}</p>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-3">Tap for full details →</p>
            </div>
          </button>
        )}

        {/* Other results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {filtered.slice(1).map((m) => {
            const meta = stockMeta[m.stock];
            return (
              <button
                key={m.name}
                onClick={() => setSelected(m)}
                className="group relative text-left glass border border-border rounded-2xl p-5 shadow-card hover:scale-[1.02] hover:border-primary transition-all"
              >
                <Hand className="absolute top-4 right-4 w-5 h-5 text-primary/30" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center group-hover:bg-gradient-mint transition-colors">
                    <Pill className="w-6 h-6 text-ink-foreground" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl text-ink truncate">{m.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium truncate">{m.generic}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{m.pharmacy}</span>
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

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm animate-fade-in p-4 md:p-6"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="med-detail-title"
        >
          <div
            className="bg-card rounded-3xl shadow-glow border-2 border-primary max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-ink text-ink-foreground p-6 md:p-8 rounded-t-3xl">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ink-foreground/10 hover:bg-ink-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-mint flex items-center justify-center shrink-0">
                  <Pill className="w-8 h-8 text-primary-foreground" strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                    {selected.prescription ? "Prescription required" : "Over the counter"}
                  </p>
                  <h2 id="med-detail-title" className="text-3xl md:text-4xl font-serif tracking-tight truncate">
                    {selected.name}
                  </h2>
                  <p className="font-medium opacity-80 truncate">{selected.generic}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-card ${stockMeta[selected.stock].classes}`}
                >
                  <span className={`w-2 h-2 rounded-full ${stockMeta[selected.stock].dot} ${selected.stock !== "out" ? "animate-mic-pulse" : ""}`} />
                  {stockMeta[selected.stock].label} · {selected.units} units
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-card text-ink">
                  <Package className="w-3 h-3" />
                  {selected.form} · {selected.strength}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full font-mono text-xs bg-card text-ink">
                  {selected.price}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-4">
              {/* Dosage info */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">Dosage Information</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-secondary/60 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <Pill className="w-3.5 h-3.5 text-primary" />
                      Dose
                    </div>
                    <p className="font-serif text-xl text-ink mt-1">{selected.dosage}</p>
                  </div>
                  <div className="bg-secondary/60 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Frequency
                    </div>
                    <p className="font-serif text-xl text-ink mt-1 leading-tight">{selected.frequency}</p>
                  </div>
                  <div className="bg-secondary/60 rounded-2xl p-4 border border-border sm:col-span-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <Utensils className="w-3.5 h-3.5 text-primary" />
                      Food &amp; Timing
                    </div>
                    <p className="font-medium text-ink mt-1">{selected.withFood}</p>
                  </div>
                </div>
              </div>

              {/* Pickup */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">Counter Location</p>
                <div className="bg-gradient-mint/10 rounded-2xl p-5 border-2 border-primary/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-mint flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-serif text-2xl text-ink leading-tight">{selected.pharmacy}</p>
                      <p className="text-sm font-medium text-muted-foreground mt-1">{selected.counter}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-destructive mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Important Information
                </p>
                <div className="bg-destructive/5 rounded-2xl p-4 border border-destructive/20">
                  <p className="text-sm font-medium text-ink leading-relaxed">{selected.warnings}</p>
                </div>
              </div>

              {selected.prescription && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                  <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p>Bring a valid prescription from your physician to the pickup counter.</p>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full mt-2 py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-bold shadow-card hover:opacity-95 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Medicine;
