import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { uploadPath } from "@/lib/db";
import { deleteMedia, getMedia, isRevealed, visibleMedia } from "@/lib/store";
import { getGuestId } from "@/lib/guest";
import { isAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = await getMedia(id);
  const [guestId, admin] = await Promise.all([getGuestId(), isAdmin()]);
  if (!media || visibleMedia([media], guestId, admin).length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const path = uploadPath(media.stored);
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": media.mime,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename="${media.stored}"`,
  };

  // Byte ranges so video/audio can seek (Safari requires this).
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    return new Response(
      Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream,
      {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(end - start + 1),
        },
      },
    );
  }

  return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, {
    headers: { ...headers, "Content-Length": String(size) },
  });
}

/** Guests can remove their own items while the roll is still private; admins any time. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = await getMedia(id);
  if (!media) return new Response(null, { status: 204 });
  const [guestId, admin] = await Promise.all([getGuestId(), isAdmin()]);
  const owner = Boolean(guestId) && media.guestId === guestId;
  if (!admin && !(owner && !isRevealed())) {
    return new Response("Forbidden", { status: 403 });
  }
  await deleteMedia(id);
  return new Response(null, { status: 204 });
}
