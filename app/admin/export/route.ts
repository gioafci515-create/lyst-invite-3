import { isAdmin } from "@/lib/auth";
import { listRsvps } from "@/lib/store";

// Prefix risky leading characters so spreadsheets do not run cell content as a formula.
function cell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await listRsvps();
  const lines = [
    ["Name", "Response", "Guests", "Companion", "Meal", "Dietary", "Special request", "Received (UTC)"]
      .map(cell)
      .join(","),
    ...rows.map((r) =>
      [r.name, r.attendance, String(r.guests), r.companion, r.meal, r.dietary, r.request, r.createdAt]
        .map(cell)
        .join(","),
    ),
  ];

  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rsvps.csv"',
      "Cache-Control": "no-store",
    },
  });
}
