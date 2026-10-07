import type { Media, MediaKind } from "./store";

export const MIME: Record<string, { kind: MediaKind; ext: string }> = {
  "image/jpeg": { kind: "photo", ext: ".jpg" },
  "image/png": { kind: "photo", ext: ".png" },
  "image/webp": { kind: "photo", ext: ".webp" },
  "image/gif": { kind: "photo", ext: ".gif" },
  "image/heic": { kind: "photo", ext: ".heic" },
  "image/heif": { kind: "photo", ext: ".heif" },
  "video/mp4": { kind: "video", ext: ".mp4" },
  "video/webm": { kind: "video", ext: ".webm" },
  "video/quicktime": { kind: "video", ext: ".mov" },
  "audio/webm": { kind: "voice", ext: ".weba" },
  "audio/ogg": { kind: "voice", ext: ".ogg" },
  "audio/mp4": { kind: "voice", ext: ".m4a" },
  "audio/x-m4a": { kind: "voice", ext: ".m4a" },
  "audio/mpeg": { kind: "voice", ext: ".mp3" },
  "audio/wav": { kind: "voice", ext: ".wav" },
};

export const LIMIT: Record<MediaKind, number> = {
  photo: 15 * 1024 * 1024,
  video: 120 * 1024 * 1024,
  voice: 25 * 1024 * 1024,
};

export const CONTEXTS: Media["context"][] = ["roll", "guestbook", "video", "future"];

export const ALLOWED: Record<Media["context"], MediaKind[]> = {
  roll: ["photo", "video"],
  guestbook: ["voice"],
  video: ["video"],
  future: ["photo"],
};

/** Disposable-camera mode: each guest gets this many live captures. */
export const DISPOSABLE_SHOTS = 24;
