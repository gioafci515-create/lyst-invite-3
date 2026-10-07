import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE = "lyst_guest";
const ONE_YEAR = 60 * 60 * 24 * 365;
const UUID = /^[0-9a-f-]{36}$/i;

/** Read the anonymous guest id, if this browser has one. */
export async function getGuestId(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  return v && UUID.test(v) ? v : null;
}

/** Read or create the guest id. Only call from route handlers / server actions. */
export async function ensureGuestId(): Promise<string> {
  const existing = await getGuestId();
  if (existing) return existing;
  const id = randomUUID();
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}
