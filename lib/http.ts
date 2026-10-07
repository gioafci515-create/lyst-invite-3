import { headers } from "next/headers";

export const fail = (error: string, status = 400) =>
  Response.json({ error }, { status });

export const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const hits = new Map<string, number[]>();

/** Small in-memory limiter: `limit` writes per `windowMs` per client address. */
export async function tooMany(
  bucket: string,
  limit = 30,
  windowMs = 60_000,
): Promise<boolean> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return recent.length > limit;
}
