import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import {
  contributionCounts,
  listAnswers,
  listFutureMessages,
  listLetters,
  listMedia,
  listQuestions,
  listSeals,
  visibleMedia,
} from "@/lib/store";
import { EVENT, formatCountdown, longDate } from "@/lib/event";
import { Content, Journey, Loading } from "../ui";
import CapsuleClient from "./CapsuleClient";

export default function CapsulePage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <CapsuleContent />
    </Suspense>
  );
}

async function CapsuleContent() {
  await connection();
  const guestId = await getGuestId();
  const now = new Date();
  const unlocked = now >= EVENT.capsuleUnlock;
  const [counts, seals] = await Promise.all([contributionCounts(), listSeals()]);
  const sealed = Boolean(guestId) && seals.some((x) => x.guestId === guestId);

  let archive = null;
  if (unlocked) {
    const [media, letters, messages, answers, questions] = await Promise.all([
      listMedia(),
      listLetters(),
      listFutureMessages(),
      listAnswers(),
      listQuestions(),
    ]);
    const qText = new Map(questions.map((q) => [q.id, q.question]));
    archive = {
      media: visibleMedia(media, guestId).filter((m) => m.context !== "future").map((m) => ({
        id: m.id,
        kind: m.kind,
        context: m.context,
      })),
      letters: letters.map((l) => ({ id: l.id, text: l.text, author: l.anonymous ? "Anonymous" : l.name })),
      messages: messages.map((m) => ({
        id: m.id,
        text: m.text,
        author: m.name || "A guest",
        photoId: m.photoId,
      })),
      answers: answers.map((a) => ({
        id: a.id,
        question: qText.get(a.questionId) ?? "Host question",
        text: a.text,
      })),
    };
  }

  return (
    <Content>
      <CapsuleClient
        counts={counts}
        sealed={sealed}
        unlocked={unlocked}
        unlockIso={EVENT.capsuleUnlock.toISOString()}
        unlockLabel={longDate(EVENT.capsuleUnlock)}
        initialCountdown={formatCountdown(EVENT.capsuleUnlock.getTime() - now.getTime())}
        archive={archive}
      />
      <Journey action="SEAL CAPSULE" here="REMEMBER" />
    </Content>
  );
}
