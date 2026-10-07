import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { listFutureMessages } from "@/lib/store";
import { EVENT, formatCountdown, longDate } from "@/lib/event";
import { Content, Journey, Loading } from "../ui";
import MessageForLater from "./MessageForLater";

export default function LaterPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <LaterContent />
    </Suspense>
  );
}

async function LaterContent() {
  await connection();
  const guestId = await getGuestId();
  const now = new Date();
  const unlocked = now >= EVENT.capsuleUnlock;
  const mine = guestId
    ? (await listFutureMessages()).filter((m) => m.guestId === guestId)
    : [];

  return (
    <Content>
      <MessageForLater
        unlocked={unlocked}
        unlockIso={EVENT.capsuleUnlock.toISOString()}
        unlockLabel={longDate(EVENT.capsuleUnlock)}
        initialCountdown={formatCountdown(EVENT.capsuleUnlock.getTime() - now.getTime())}
        mine={mine.map((m) => ({
          id: m.id,
          // Text stays sealed until the reveal date, even from its author.
          text: unlocked ? m.text : null,
          photoId: unlocked ? m.photoId : "",
          createdAt: m.createdAt,
        }))}
      />
      <Journey action="SEAL MESSAGE" here="PARTICIPATE" />
    </Content>
  );
}
