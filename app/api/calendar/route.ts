import { EVENT } from "@/lib/event";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function GET() {
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LYST//NOCTURNE 11//EN",
    "BEGIN:VEVENT",
    "UID:nocturne-11@lyst.events",
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(EVENT.start)}`,
    `DTEND:${stamp(EVENT.end)}`,
    `SUMMARY:${EVENT.name}`,
    `LOCATION:${EVENT.venue}\\, ${EVENT.city.replace(",", "\\,")}`,
    "DESCRIPTION:A single-night sound and light commission across three chambers.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nocturne-11.ics"',
    },
  });
}
