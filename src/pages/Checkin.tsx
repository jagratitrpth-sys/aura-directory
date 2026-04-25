import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, MessageSquare, Stethoscope,
  Heart, Brain, Bone, Baby, Eye, Activity, Pill, Sparkles, Mic,
  RotateCcw, Plus, Clock, X, Ear, Smile, Scan, Microscope, FlaskConical,
  Syringe, Bandage, HeartPulse, Droplet, Wind,
} from "lucide-react";
import KioskHeader from "@/components/KioskHeader";
import VoiceSearchBar from "@/components/VoiceSearchBar";
import HandStatusBadge from "@/components/HandStatusBadge";
import DwellOverlay from "@/components/DwellOverlay";
import HighContrastToggle from "@/components/HighContrastToggle";
import { useHandRaise } from "@/hooks/useHandRaise";
import { useDwellSelect } from "@/hooks/useDwellSelect";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import {
  loadLastCheckin, saveLastCheckin, clearLastCheckin, formatRelative,
  type CheckinSnapshot,
} from "@/lib/checkinStore";

type StepKey = "intro" | "name" | "reason" | "department" | "confirm" | "done";

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
  "Vaccination",
  "Imaging / X-ray",
  "Blood test",
  "Physical therapy",
  "Pre-surgery consult",
  "Mental health visit",
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
  { name: "ENT", Icon: Ear },
  { name: "Dental Care", Icon: Smile },
  { name: "Dermatology", Icon: Scan },
  { name: "Radiology", Icon: Microscope },
  { name: "Laboratory", Icon: FlaskConical },
  { name: "Vaccination", Icon: Syringe },
  { name: "Trauma Care", Icon: Bandage },
  { name: "ICU", Icon: HeartPulse },
  { name: "Maternity", Icon: Baby },
  { name: "Nephrology", Icon: Droplet },
  { name: "Pulmonology", Icon: Wind },
];

/* ---------- Reusable bits ---------- */

interface DwellOptionProps {
  selected: boolean;
  dwelling: boolean;
  progress: number;
  onClick: () => void;
  children: React.ReactNode;
  tile?: boolean;
}
const DwellOption = forwardRef<HTMLButtonElement, DwellOptionProps>(
  ({ selected, dwelling, progress, onClick, children, tile = false }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={[
        "relative overflow-hidden rounded-2xl font-medium transition-all border-2",
        tile ? "p-4 flex flex-col items-center gap-1 text-center" : "px-5 py-4 text-left",
        selected
          ? tile
            ? "bg-gradient-mint text-primary-foreground border-primary shadow-glow scale-[1.05]"
            : "bg-ink text-ink-foreground border-ink shadow-card scale-[1.02]"
          : dwelling
          ? "glass border-primary text-ink scale-[1.04] shadow-glow"
          : "glass border-border text-ink hover:border-primary/60",
      ].join(" ")}
    >
      <span className="relative z-10 block">{children}</span>
      {dwelling && !selected && (
        <span
          className="absolute left-0 bottom-0 h-1 bg-primary"
          style={{ width: `${progress * 100}%`, transition: "width 75ms linear" }}
        />
      )}
    </button>
  )
);
DwellOption.displayName = "DwellOption";

interface NavButtonProps {
  disabled?: boolean;
  dwelling: boolean;
  progress: number;
  onClick: () => void;
  variant: "primary" | "ghost";
  children: React.ReactNode;
}
const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ disabled, dwelling, progress, onClick, variant, children }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-transform",
        variant === "primary"
          ? "bg-gradient-ink text-ink-foreground shadow-ink"
          : "glass border border-border text-ink",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        dwelling && !disabled && "scale-105 shadow-glow",
      ].join(" ")}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {dwelling && !disabled && (
        <span
          className="absolute left-0 bottom-0 h-1 bg-primary"
          style={{ width: `${progress * 100}%`, transition: "width 75ms linear" }}
        />
      )}
    </button>
  )
);
NavButton.displayName = "NavButton";

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

/* ---------- Page ---------- */

const Checkin = () => {
  const navigate = useNavigate();
  const [lastSnapshot] = useState<CheckinSnapshot | null>(() => loadLastCheckin());
  const [step, setStep] = useState<StepKey>(() => (loadLastCheckin() ? "intro" : "name"));
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [department, setDepartment] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const [handTrackingOn, setHandTrackingOn] = useState(false);
  const hand = useHandRaise();

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.key === step), [step]);

  const canNext =
    (step === "name" && name.trim().length > 1) ||
    (step === "reason" && reason !== "") ||
    (step === "department" && department !== "") ||
    step === "confirm";

  // Latest values for use inside callbacks (voice commands run from a long-lived listener)
  const stateRef = useRef({ step, canNext });
  useEffect(() => { stateRef.current = { step, canNext }; }, [step, canNext]);

  const reuseLast = () => {
    if (!lastSnapshot) return;
    setName(lastSnapshot.name);
    setReason(lastSnapshot.reason);
    setDepartment(lastSnapshot.department);
    setStep("confirm");
  };

  const startFresh = () => {
    setName("");
    setReason("");
    setDepartment("");
    setStep("name");
  };

  const next = () => {
    const s = stateRef.current.step;
    if (s === "intro") { startFresh(); return; }
    if (!stateRef.current.canNext && s !== "confirm") return;
    if (s === "name") setStep("reason");
    else if (s === "reason") setStep("department");
    else if (s === "department") setStep("confirm");
    else if (s === "confirm") {
      saveLastCheckin({ name, reason, department });
      const t = `Q-${Math.floor(100 + Math.random() * 900)}`;
      setToken(t);
      setStep("done");
      setTimeout(() => navigate("/"), 6000);
    }
  };

  const prev = () => {
    const s = stateRef.current.step;
    if (s === "reason") setStep("name");
    else if (s === "department") setStep("reason");
    else if (s === "confirm") setStep("department");
  };

  // Voice command map per step
  const commands = useMemo(() => {
    const base: Record<string, () => void> = {
      "next": next,
      "continue": next,
      "go ahead": next,
      "back": prev,
      "go back": prev,
      "previous": prev,
    };
    if (step === "intro") {
      base["reuse"] = reuseLast;
      base["reuse last"] = reuseLast;
      base["use last"] = reuseLast;
      base["yes"] = reuseLast;
      base["start fresh"] = startFresh;
      base["start over"] = startFresh;
      base["new"] = startFresh;
      base["no"] = startFresh;
    }
    if (step === "confirm") {
      base["confirm"] = next;
      base["check in"] = next;
      base["submit"] = next;
    }
    if (step === "reason") {
      REASONS.forEach((r) => {
        base[r.toLowerCase()] = () => setReason(r);
        const short = r.split(/[\s/]/)[0].toLowerCase();
        if (short.length > 3) base[short] = () => setReason(r);
      });
    }
    if (step === "department") {
      DEPARTMENTS.forEach(({ name: n }) => {
        base[n.toLowerCase()] = () => setDepartment(n);
        const short = n.split(" ")[0].toLowerCase();
        if (short.length > 3) base[short] = () => setDepartment(n);
      });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const voice = useVoiceCommands({
    commands,
    // The name step uses VoiceSearchBar's own SpeechRecognition — don't conflict.
    enabled: step !== "name" && step !== "done",
  });

  // Hand cursor in viewport pixels (matches HandStatusBadge mapping)
  const cursor = useMemo(() => {
    if (!handTrackingOn || !hand.active || !hand.position) return null;
    return {
      x: hand.position.x * window.innerWidth,
      y: (hand.position.y * 0.6 + 0.2) * window.innerHeight,
    };
  }, [handTrackingOn, hand.active, hand.position]);

  const { register, activeId, progress, nodes, centerToleranceRatio } = useDwellSelect({
    cursor,
    onSelect: (id) => {
      if (id.startsWith("reason:")) setReason(id.slice("reason:".length));
      else if (id.startsWith("dept:")) setDepartment(id.slice("dept:".length));
      else if (id === "intro:reuse") reuseLast();
      else if (id === "intro:fresh") startFresh();
      else if (id === "nav:next") next();
      else if (id === "nav:back") prev();
    },
  });

  const toggleHand = () => {
    if (handTrackingOn) { hand.stop(); setHandTrackingOn(false); }
    else { hand.start(); setHandTrackingOn(true); }
  };

  return (
    <main className="min-h-screen flex flex-col px-8 md:px-12 py-8">
      <KioskHeader showBack listening={voice.listening} />
      <HighContrastToggle />

      <section className="flex-1 max-w-3xl mx-auto w-full mt-10 animate-fade-in">
        {/* Progress */}
        {step !== "done" && step !== "intro" && (
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

        {/* Voice hint */}
        {step !== "name" && step !== "done" && step !== "intro" && voice.supported && (
          <div className="flex items-center justify-center gap-2 mb-5 -mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <span className="relative w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-primary" />
                {voice.listening && <span className="absolute inset-0 rounded-full bg-primary animate-ring-pulse" />}
              </span>
              <Mic className="w-3.5 h-3.5 text-ink" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink">
                Say "next", "back"
                {step === "confirm"
                  ? ', or "confirm"'
                  : step === "reason" || step === "department"
                  ? ", or an option name"
                  : ""}
              </span>
            </div>
          </div>
        )}

        <div className="glass rounded-3xl p-8 md:p-12 shadow-card min-h-[420px] flex flex-col">
          {step === "intro" && lastSnapshot && (
            <StepShell
              icon={<Clock className="w-7 h-7" />}
              eyebrow="Welcome back"
              title={`Reuse last info, ${lastSnapshot.name.split(" ")[0]}?`}
              subtitle={`We saved your last check-in ${formatRelative(lastSnapshot.savedAt)}. Pick up where you left off, or start fresh.`}
            >
              <div
                role="radiogroup"
                aria-label="Resume previous check-in or start fresh"
                className="grid sm:grid-cols-2 gap-3 w-full"
              >
                <button
                  ref={register("intro:reuse")}
                  onClick={reuseLast}
                  role="radio"
                  aria-checked={false}
                  aria-label={`Reuse last info: ${lastSnapshot.reason} in ${lastSnapshot.department}`}
                  aria-describedby="intro-reuse-desc"
                  className={[
                    "relative overflow-hidden rounded-2xl p-5 text-left transition-all border-2",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60",
                    activeId === "intro:reuse"
                      ? "bg-gradient-mint text-primary-foreground border-primary shadow-glow scale-[1.04]"
                      : "bg-ink text-ink-foreground border-ink shadow-card hover:scale-[1.02]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest opacity-80">
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Reuse last info
                  </div>
                  <p className="font-serif text-2xl mt-2 leading-tight">{lastSnapshot.reason}</p>
                  <p id="intro-reuse-desc" className="font-medium opacity-80 mt-1">{lastSnapshot.department}</p>
                  {activeId === "intro:reuse" && (
                    <span
                      className="absolute left-0 bottom-0 h-1 bg-primary-foreground/80"
                      style={{ width: `${progress * 100}%`, transition: "width 75ms linear" }}
                      aria-hidden="true"
                    />
                  )}
                </button>
                <button
                  ref={register("intro:fresh")}
                  onClick={startFresh}
                  role="radio"
                  aria-checked={false}
                  aria-label="Start a fresh check-in"
                  aria-describedby="intro-fresh-desc"
                  className={[
                    "relative overflow-hidden rounded-2xl p-5 text-left transition-all border-2",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60",
                    activeId === "intro:fresh"
                      ? "glass border-primary text-ink shadow-glow scale-[1.04]"
                      : "glass border-border text-ink hover:border-primary/60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Start fresh
                  </div>
                  <p className="font-serif text-2xl mt-2 leading-tight">New check-in</p>
                  <p id="intro-fresh-desc" className="text-muted-foreground font-medium mt-1">Enter name, reason, and department from scratch.</p>
                  {activeId === "intro:fresh" && (
                    <span
                      className="absolute left-0 bottom-0 h-1 bg-primary"
                      style={{ width: `${progress * 100}%`, transition: "width 75ms linear" }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
              <button
                onClick={() => { clearLastCheckin(); startFresh(); }}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded"
                aria-label="Forget saved check-in info"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Forget saved info
              </button>

              {/* Screen-reader live region: announces hover/dwell state on intro options */}
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {activeId === "intro:reuse"
                  ? `Selecting reuse last info, ${Math.round(progress * 100)} percent`
                  : activeId === "intro:fresh"
                  ? `Selecting start fresh, ${Math.round(progress * 100)} percent`
                  : "Use Tab to focus an option, or hold your hand over a card for two seconds to select."}
              </p>
            </StepShell>
          )}

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
              subtitle="Pick one — tap, hover with your hand, or say it aloud."
            >
              <div className="grid sm:grid-cols-2 gap-3 w-full">
                {REASONS.map((r) => {
                  const dwellId = `reason:${r}`;
                  const dwelling = activeId === dwellId;
                  return (
                    <DwellOption
                      key={r}
                      ref={register(dwellId)}
                      selected={reason === r}
                      dwelling={dwelling}
                      progress={dwelling ? progress : 0}
                      onClick={() => setReason(r)}
                    >
                      {r}
                    </DwellOption>
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
              subtitle="Tap, hover with your hand, or say a department name."
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                {DEPARTMENTS.map(({ name: n, Icon }) => {
                  const dwellId = `dept:${n}`;
                  const dwelling = activeId === dwellId;
                  return (
                    <DwellOption
                      key={n}
                      ref={register(dwellId)}
                      selected={department === n}
                      dwelling={dwelling}
                      progress={dwelling ? progress : 0}
                      onClick={() => setDepartment(n)}
                      tile
                    >
                      <Icon className="w-6 h-6 mx-auto" strokeWidth={2.2} />
                      <span className="text-xs font-semibold leading-tight block mt-2">{n}</span>
                    </DwellOption>
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
              subtitle='Confirm by tapping below or saying "confirm".'
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
          {step !== "done" && step !== "intro" && (
            <div className="mt-auto pt-8 flex items-center justify-between">
              <NavButton
                ref={register("nav:back")}
                disabled={step === "name"}
                dwelling={activeId === "nav:back"}
                progress={activeId === "nav:back" ? progress : 0}
                onClick={prev}
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </NavButton>
              <NavButton
                ref={register("nav:next")}
                disabled={!canNext}
                dwelling={activeId === "nav:next"}
                progress={activeId === "nav:next" ? progress : 0}
                onClick={next}
                variant="primary"
              >
                {step === "confirm" ? "Confirm check-in" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </NavButton>
            </div>
          )}
        </div>
      </section>

      {/* Visual hand cursor + per-option center-zone overlay */}
      {handTrackingOn && (
        <DwellOverlay
          cursor={cursor}
          nodes={nodes}
          activeId={activeId}
          progress={progress}
          centerToleranceRatio={centerToleranceRatio}
        />
      )}

      <HandStatusBadge
        enabled={handTrackingOn}
        onToggle={toggleHand}
        active={hand.active}
        confidence={hand.confidence}
        position={hand.position}
        error={hand.error}
        hideCursor
      />
    </main>
  );
};

export default Checkin;
