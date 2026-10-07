import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { isRevealed, listMedia, visibleMedia } from "@/lib/store";
import { EVENT, revealAt } from "@/lib/event";
import { Content, Journey, Loading } from "../ui";
import MontagePlayer from "./MontagePlayer";

export default function MontagePage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <MontageContent />
    </Suspense>
  );
}

async function MontageContent() {
  await connection();
  const now = new Date();
  const guestId = await getGuestId();
  const revealed = isRevealed(now);
  const media = (await listMedia()).filter(
    (m) => (m.context === "roll" || m.context === "video") && m.kind !== "voice",
  );
  // Oldest first so the montage tells the night in order.
  const reel = visibleMedia(media, guestId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((m) => ({ id: m.id, kind: m.kind === "video" ? ("video" as const) : ("photo" as const) }));

  const end = revealAt().getTime();
  const start = EVENT.start.getTime();
  const progress = revealed
    ? 100
    : Math.max(0, Math.min(99, Math.round(((now.getTime() - start) / (end - start)) * 100)));

  return (
    <Content>
      <MontagePlayer reel={reel} ready={revealed} progress={progress} />
      <Journey action="WATCH NOW" here="REMEMBER" />
    </Content>
  );
}
