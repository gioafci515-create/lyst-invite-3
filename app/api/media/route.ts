import { randomUUID } from "crypto";
import { saveUpload } from "@/lib/db";
import { addMedia, listMedia } from "@/lib/store";
import { ALLOWED, CONTEXTS, DISPOSABLE_SHOTS, LIMIT, MIME } from "@/lib/media";
import { ensureGuestId } from "@/lib/guest";
import { fail, tooMany } from "@/lib/http";

export async function POST(request: Request) {
  if (await tooMany("media", 40)) return fail("Too many uploads. Try again shortly.", 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("No file received.");

  const context = CONTEXTS.find((c) => c === form.get("context")) ?? "roll";
  const mime = file.type.split(";")[0].trim().toLowerCase();
  const spec = MIME[mime];
  if (!spec) return fail("This file type is not supported.", 415);
  if (!ALLOWED[context].includes(spec.kind)) {
    return fail("This file does not match what you are adding.", 415);
  }
  if (file.size > LIMIT[spec.kind]) {
    return fail(`File too large (max ${Math.round(LIMIT[spec.kind] / 1048576)} MB).`, 413);
  }

  const guestId = await ensureGuestId();
  const source = form.get("source") === "capture" ? "capture" : "upload";
  if (context === "roll" && source === "capture") {
    const used = (await listMedia()).filter(
      (m) => m.guestId === guestId && m.context === "roll" && m.source === "capture",
    ).length;
    if (used >= DISPOSABLE_SHOTS) {
      return fail(`Your disposable camera is full (${DISPOSABLE_SHOTS} shots). You can still upload photos.`, 403);
    }
  }
  const id = randomUUID();
  const stored = `${id}${spec.ext}`;
  await saveUpload(id, spec.ext, Buffer.from(await file.arrayBuffer()));

  const seconds = Math.max(0, Math.min(3600, Number(form.get("seconds")) || 0));
  const media = await addMedia({
    guestId,
    kind: spec.kind,
    mime,
    stored,
    source,
    seconds,
    size: file.size,
    context,
  });
  return Response.json({ ok: true, id: media.id }, { status: 201 });
}
