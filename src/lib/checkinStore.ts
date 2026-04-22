const STORAGE_KEY = "medicare:lastCheckin";

export interface CheckinSnapshot {
  name: string;
  reason: string;
  department: string;
  /** ISO timestamp of when this snapshot was saved */
  savedAt: string;
}

export function loadLastCheckin(): CheckinSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckinSnapshot>;
    if (!parsed.name || !parsed.reason || !parsed.department) return null;
    return {
      name: String(parsed.name),
      reason: String(parsed.reason),
      department: String(parsed.department),
      savedAt: String(parsed.savedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export function saveLastCheckin(s: Omit<CheckinSnapshot, "savedAt">): void {
  try {
    const payload: CheckinSnapshot = { ...s, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearLastCheckin(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
