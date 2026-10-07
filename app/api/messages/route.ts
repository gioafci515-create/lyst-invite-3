import { addFutureMessage, getMedia } from "@/lib/store";
import { ensureGuestId } from "@/lib/guest";
import { EVENT } from "@/lib/event";
import { clean, fail, tooMany } from "@/lib/http";

/** Message for later. Locked immediately; the photo (if any) is uploaded first via /api/media (context=future). */
export async function POST(request: Request) {
  if (await tooMany("messages", 10)) return fail("Too many requests. Try again shortly.", 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const text = clean(body.text, 2000);
  if (!text) return fail("Write your message first.");
  const name = clean(body.name, 80);

  const guestId = await ensureGuestId();
  let photoId = "";
  if (typeof body.photoId === "string" && body.photoId) {
    const photo = await getMedia(body.photoId);
    if (!photo || photo.guestId !== guestId || photo.context !== "future") {
      return fail("Photo not found.");
    }
    photoId = photo.id;
  }

  await addFutureMessage({
    guestId,
    name,
    text,
    photoId,
    revealAt: EVENT.capsuleUnlock.toISOString(),
  });
  return Response.json({ ok: true }, { status: 201 });
}
