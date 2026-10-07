import { addCompletion, listChallenges } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { fail, tooMany } from "@/lib/http";

export async function POST(request: Request) {
  if (await tooMany("challenges", 20)) return fail("Too many requests. Try again shortly.", 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const challenge = (await listChallenges()).find((c) => c.id === body.challengeId);
  if (!challenge || !challenge.active) return fail("This challenge is not active.", 404);

  const created = await addCompletion({
    challengeId: challenge.id,
    guestId: await ensureGuestId(),
  });
  if (!created) return fail("Already completed.", 409);
  return Response.json({ ok: true }, { status: 201 });
}
