import { addSeal } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { fail, tooMany } from "@/lib/http";

export async function POST() {
  if (await tooMany("capsule", 10)) return fail("Too many requests. Try again shortly.", 429);
  await addSeal(await ensureGuestId());
  return Response.json({ ok: true }, { status: 201 });
}
