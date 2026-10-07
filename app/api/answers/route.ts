import { addAnswer, listQuestions } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { clean, fail, tooMany } from "@/lib/http";

export async function POST(request: Request) {
  if (await tooMany("answers", 20)) return fail("Too many requests. Try again shortly.", 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const question = (await listQuestions()).find((q) => q.id === body.questionId);
  if (!question || !question.active) return fail("This question is not open.", 404);

  const text = clean(body.text, question.kind === "short" ? 200 : 2000);
  if (!text) return fail("Write your answer first.");

  const created = await addAnswer({
    questionId: question.id,
    guestId: await ensureGuestId(),
    text,
  });
  if (!created) return fail("You have already answered.", 409);
  return Response.json({ ok: true }, { status: 201 });
}
