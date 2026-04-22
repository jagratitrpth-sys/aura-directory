import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, MessageSquare, Stethoscope,
  Heart, Brain, Bone, Baby, Eye, Activity, Pill, Sparkles,
} from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import VoiceSearchBar from "@/components/VoiceSearchBar";

type StepKey = "name" | "reason" | "department" | "confirm" | "done";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "name", label: "Your name" },
  { key: "reason", label: "Visit reason" },
  { key: "department", label: "Department" },
  { key: "confirm", label: "Review" },
];

const REASONS = [
  "Routine check-up",
  "Follow-up visit",
  "Lab results",
  "Prescription refill",
  "Specialist referral",
  "Emergency / urgent",
];

const DEPARTMENTS = [
  { name: "General Medicine", Icon: Stethoscope },
  { name: "Cardiology", Icon: Heart },
  { name: "Neurology", Icon: Brain },
  { name: "Orthopedics", Icon: Bone },
  { name: "Pediatrics", Icon: Baby },
  { name: "Ophthalmology", Icon: Eye },
  { name: "Emergency", Icon: Activity },
  { name: "Pharmacy", Icon: Pill },
];

const Checkin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>("name");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [department, setDepartment] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.key === step), [step]);
  const total = STEPS.length;

  const canNext =
    (step === "name" && name.trim().length > 1) ||
    (step === "reason" && reason !== "") ||
    (step === "department" && department !== "") ||
    step === "confirm";

  const next = () => {
    if (step === "name") setStep("reason");
    else if (step === "reason") setStep("department");
    else if (step === "department") setStep("confirm");
    else if (step === "confirm") {
      // Generate token
      const t = `Q-${Math.floor(100 + Math.random() * 900)}`;
      setToken(t);
      setStep("done");
      setTimeout(() => navigate("/"), 6000);
    }
  };

  const prev = () => {
    if (step === "reason") setStep("name");
    else if (step === "department") setStep("reason");
    else if (step === "confirm") setStep("department");
  };

  return (
    <main className="min-h-screen flex flex-col px-8 md:px-12 py-8">
      <KioskHeader showBack />

      <section className="flex-1 max-w-3xl mx-auto w-full mt-10 animate-fade-in">
        {/* Progress */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-3 mb-10">
            {STEPS.map((s, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={[
                        "w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-semibold transition-all",
                        done
                          ? "bg-primary text-primary-foreground"
                          : current
                          ? "bg-ink text-ink-foreground scale-110 shadow-card"
                          : "glass text-muted-foreground",
                      ].join(" ")}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={[
                        "hidden md:inline font-mono text-[11px] uppercase tracking-widest",
                        current ? "text-ink" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 h-px ${i < stepIndex ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="glass rounded-3xl p-8 md:p-12 shadow-card min-h-[420px] flex flex-col">
          {step === "name" && (
            <StepShell
              icon={<User className="w-7 h-7" />}
              eyebrow="Step 1 of 4"
              title="What's your name?"
              subtitle="Say your full name out loud or type below."
            >
              <VoiceSearchBar
                value={name}
                onChange={setName}
                placeholder="Say or type your full name…"
              />
            </StepShell>
          )}

          {step === "reason" && (
            <StepShell
              icon={<MessageSquare className="w-7 h-7" />}
              eyebrow="Step 2 of 4"
              title={`Hi ${name.split(" ")[0]}, what brings you in?`}
              subtitle="Pick one reason for today's visit."
            >
              <div className="grid sm:grid-cols-2 gap-3 w-full">
                {REASONS.map((r) => {
                  const sel = reason === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={[
                        "px-5 py-4 rounded-2xl text-left font-medium transition-all border-2",
                        sel
                          ? "bg-ink text-ink-foreground border-ink shadow-card scale-[1.02]"
                          : "glass border-border text-ink hover:border-primary/60",
                      ].join(" ")}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === "department" && (
            <StepShell
              icon={<Stethoscope className="w-7 h-7" />}
              eyebrow="Step 3 of 4"
              title="Which department?"
              subtitle="Select the department for your visit."
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                {DEPARTMENTS.map(({ name: n, Icon }) => {
                  const sel = department === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setDepartment(n)}
                      className={[
                        "p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 text-center",
                        sel
                          ? "bg-gradient-mint text-primary-foreground border-primary shadow-glow scale-[1.05]"
                          : "glass border-border text-ink hover:border-primary/60",
                      ].join(" ")}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                      <span className="text-xs font-semibold leading-tight">{n}</span>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === "confirm" && (
            <StepShell
              icon={<CheckCircle2 className="w-7 h-7" />}
              eyebrow="Step 4 of 4"
              title="Please review"
              subtitle="Confirm your check-in details below."
            >
              <div className="w-full space-y-3">
                <ReviewRow label="Name" value={name} />
                <ReviewRow label="Reason" value={reason} />
                <ReviewRow label="Department" value={department} />
              </div>
            </StepShell>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center text-center flex-1">
              <div className="relative mb-6">
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ring-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-mint flex items-center justify-center shadow-glow">
                  <CheckCircle2 className="w-12 h-12 text-primary-foreground" strokeWidth={2.4} />
                </div>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">Check-in complete</span>
              <h2 className="text-5xl md:text-6xl font-serif text-ink mt-3 leading-tight">
                You're all set, <span className="italic text-primary">{name.split(" ")[0]}</span>.
              </h2>
              <div className="mt-8 px-8 py-6 rounded-2xl bg-ink text-ink-foreground inline-flex items-center gap-6">
                <div className="text-left">
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Your token</p>
                  <p className="font-serif text-5xl mt-1">{token}</p>
                </div>
                <div className="w-px h-12 bg-ink-foreground/20" />
                <div className="text-left">
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Department</p>
                  <p className="font-semibold text-lg mt-1">{department}</p>
                </div>
              </div>
              <p className="mt-8 text-muted-foreground font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Please proceed to {department}. Returning to home shortly…
              </p>
            </div>
          )}

          {/* Nav buttons */}
          {step !== "done" && (
            <div className="mt-auto pt-8 flex items-center justify-between">
              <button
                onClick={prev}
                disabled={step === "name"}
                className="flex items-center gap-2 px-5 py-3 rounded-full glass border border-border font-semibold text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={next}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-ink text-ink-foreground font-semibold shadow-ink disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              >
                {step === "confirm" ? "Confirm check-in" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

const StepShell = ({
  icon, eyebrow, title, subtitle, children,
}: { icon: React.ReactNode; eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="flex-1 flex flex-col">
    <div className="flex items-center gap-3 mb-1">
      <div className="w-12 h-12 rounded-2xl bg-gradient-ink text-ink-foreground flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="text-3xl md:text-4xl font-serif text-ink tracking-tight">{title}</h2>
      </div>
    </div>
    <p className="text-muted-foreground font-medium mt-2 mb-6">{subtitle}</p>
    {children}
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between bg-secondary/60 rounded-2xl px-5 py-4 border border-border">
    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="font-serif text-xl text-ink">{value || "—"}</span>
  </div>
);

export default Checkin;
