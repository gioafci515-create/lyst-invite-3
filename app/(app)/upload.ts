export type UploadContext = "roll" | "guestbook" | "video" | "future";

/** Upload one file/blob. Resolves with the new media id or throws an Error with a guest-friendly message. */
export async function postMedia(
  blob: Blob,
  opts: {
    context: UploadContext;
    source: "capture" | "upload";
    filename: string;
    seconds?: number;
  },
): Promise<string> {
  const form = new FormData();
  form.set("file", new File([blob], opts.filename, { type: blob.type }));
  form.set("context", opts.context);
  form.set("source", opts.source);
  if (opts.seconds) form.set("seconds", String(Math.round(opts.seconds)));

  let res: Response;
  try {
    res = await fetch("/api/media", { method: "POST", body: form });
  } catch {
    throw new Error("Network problem. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed. Try again.");
  }
  return (await res.json()).id as string;
}

export const mmss = (total: number) => {
  const s = Math.max(0, Math.floor(total));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Best supported MediaRecorder mime type from a preference list. */
export function pickMime(candidates: string[]): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}
