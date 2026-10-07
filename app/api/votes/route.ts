import { addVote, listPolls } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { clean, fail, tooMany } from "@/lib/http";

export async function POST(request: Request) {
  if (await tooMany("votes", 30)) return fail("Too many requests. Try again shortly.", 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const poll = (await listPolls()).find((p) => p.id === body.pollId);
  if (!poll || !poll.active) return fail("This poll is not active.", 404);

  const choice = clean(body.choice, 200);
  if (!choice) return fail("Choose an answer.");
  if (poll.type !== "open" && !poll.options.includes(choice)) {
    return fail("That is not one of the options.");
  }

  const created = await addVote({
    pollId: poll.id,
    guestId: await ensureGuestId(),
    choice,
  });
  if (!created) return fail("You have already voted.", 409);
  return Response.json({ ok: true }, { status: 201 });
}
