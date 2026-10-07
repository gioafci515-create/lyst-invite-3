// Single source of truth for the event's timeline. All times are Berlin (CET, UTC+1) in winter.

export const EVENT = {
  name: "NOCTURNE 11",
  venue: "Substation K",
  city: "Berlin, Germany",
  lineup: "ECHOFORM / Chamber 11",
  start: new Date("2026-12-31T22:00:00+01:00"),
  end: new Date("2027-01-01T06:00:00+01:00"),
  rsvpDeadline: new Date("2026-12-24T18:00:00+01:00"),
  capsuleUnlock: new Date("2027-12-31T00:00:00+01:00"),
  passNumber: "11-294",
} as const;

/** When private media (camera roll, voice, video) opens to every guest. */
export function revealAt(): Date {
  const env = process.env.EVENT_REVEAL_AT;
  const d = env ? new Date(env) : null;
  return d && !Number.isNaN(d.getTime()) ? d : EVENT.end;
}

export const SCHEDULE = [
  { at: "2026-12-31T22:00:00+01:00", label: "Chamber I arrival" },
  { at: "2026-12-31T23:30:00+01:00", label: "Live: ECHOFORM" },
  { at: "2027-01-01T00:00:00+01:00", label: "Light commission" },
  { at: "2027-01-01T01:15:00+01:00", label: "Speeches / signal" },
  { at: "2027-01-01T02:00:00+01:00", label: "First dance floor" },
  { at: "2027-01-01T04:45:00+01:00", label: "Roof opens" },
  { at: "2027-01-01T06:00:00+01:00", label: "Dawn after-party" },
] as const;

export function clock(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

export type Phase = "before" | "live" | "after";

export function phase(now = new Date()): Phase {
  if (now < EVENT.start) return "before";
  if (now <= EVENT.end) return "live";
  return "after";
}

export function percentThrough(now = new Date()): number {
  const total = EVENT.end.getTime() - EVENT.start.getTime();
  const done = now.getTime() - EVENT.start.getTime();
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export function nextMoment(now = new Date()) {
  const next = SCHEDULE.find((s) => new Date(s.at) > now);
  if (!next) return null;
  return { ...next, minutes: Math.ceil((new Date(next.at).getTime() - now.getTime()) / 60000) };
}

export function countdown(to: Date, now = new Date()) {
  const ms = Math.max(0, to.getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return { ms, days, hours, minutes, done: ms === 0 };
}

export function longDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(d);
}

/** "364d · 08h" style countdown text. */
export function formatCountdown(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d · ${pad(h)}h` : `${pad(h)}h : ${pad(m)}m`;
}
