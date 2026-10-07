import { addRsvp, getRsvpByGuest, updateRsvp, type Attendance } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { EVENT } from "@/lib/event";
import { clean, fail, tooMany } from "@/lib/http";

type Parsed = {
  name: string;
  attendance: Attendance;
  guests: number;
  companion: string;
  meal: string;
  dietary: string;
  request: string;
};

function parse(body: Record<string, unknown>): Parsed | Response {
  const name = clean(body.name, 120);
  if (!name) return fail("Please enter your name.");
  const attendance = body.attendance;
  if (attendance !== "accept" && attendance !== "decline") {
    return fail("Choose yes or no.");
  }
  const companion = attendance === "accept" ? clean(body.companion, 120) : "";
  const requested = Number(body.guests);
  const guests =
    attendance === "decline"
      ? 0
      : Number.isInteger(requested) && requested >= 1 && requested <= 2
        ? requested
        : companion
          ? 2
          : 1;
  return {
    name,
    attendance,
    guests,
    companion,
    meal: attendance === "accept" ? clean(body.meal, 80) : "",
    dietary: clean(body.dietary, 500),
    request: clean(body.request, 500),
  };
}

async function read(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (await tooMany("rsvp", 10)) return fail("Too many requests. Try again shortly.", 429);
  if (new Date() > EVENT.rsvpDeadline) return fail("RSVP is closed.", 403);
  const body = await read(request);
  if (!body) return fail("Invalid request.");
  const parsed = parse(body);
  if (parsed instanceof Response) return parsed;

  const guestId = await ensureGuestId();
  const created = await addRsvp({ guestId, ...parsed });
  if (!created) {
    return fail("You have already responded. Update your response instead.", 409);
  }
  return Response.json({ ok: true }, { status: 201 });
}

export async function PUT(request: Request) {
  if (await tooMany("rsvp", 10)) return fail("Too many requests. Try again shortly.", 429);
  if (new Date() > EVENT.rsvpDeadline) return fail("RSVP is closed.", 403);
  const body = await read(request);
  if (!body) return fail("Invalid request.");
  const parsed = parse(body);
  if (parsed instanceof Response) return parsed;

  const guestId = await ensureGuestId();
  const existing = await getRsvpByGuest(guestId);
  if (!existing) return fail("No response found to update.", 404);
  await updateRsvp(existing.id, parsed);
  return Response.json({ ok: true });
}
