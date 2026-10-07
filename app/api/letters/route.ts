import { addLetter } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { clean, fail, tooMany } from "@/lib/http";

export async function POST(request: Request) {
  if (await tooMany("letters", 10)) return fail("Too many requests. Try again shortly.", 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const text = clean(body.text, 1000);
  if (!text) return fail("Write something first.");
  const anonymous = body.anonymous === true;
  const name = clean(body.name, 80);
  if (!anonymous && !name) return fail("Add your name, or send anonymously.");

  await addLetter({
    guestId: await ensureGuestId(),
    name: anonymous ? "" : name,
    anonymous,
    text,
  });
  return Response.json({ ok: true }, { status: 201 });
}
