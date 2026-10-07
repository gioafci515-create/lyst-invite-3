import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import {
  listAnnouncements,
  listAnswers,
  listChallenges,
  listCompletions,
  listLetters,
  listPolls,
  listQuestions,
  listVotes,
  tally,
} from "@/lib/store";
import { Content, Journey, Loading } from "../ui";
import InteractionHub from "./InteractionHub";

export default function InteractPage() {
  return (
    <Suspense
      fallback={
        <Content tone="violet">
          <Loading />
        </Content>
      }
    >
      <InteractContent />
    </Suspense>
  );
}

async function InteractContent() {
  await connection();
  const guestId = await getGuestId();
  const [announcements, letters, challenges, completions, polls, votes, questions, answers] =
    await Promise.all([
      listAnnouncements(),
      listLetters(),
      listChallenges(),
      listCompletions(),
      listPolls(),
      listVotes(),
      listQuestions(),
      listAnswers(),
    ]);

  const mine = <T extends { guestId: string }>(a: T[]) =>
    guestId ? a.filter((x) => x.guestId === guestId) : [];
  const myVotes = mine(votes);
  const myAnswers = mine(answers);
  const myDone = new Set(mine(completions).map((c) => c.challengeId));

  return (
    <Content tone="violet">
      <InteractionHub
        announcement={announcements.find((a) => a.active)?.text ?? null}
        letters={letters.slice(0, 30).map((l) => ({
          id: l.id,
          text: l.text,
          author: l.anonymous ? "Anonymous" : l.name,
        }))}
        challenges={challenges
          .filter((c) => c.active)
          .map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            done: myDone.has(c.id),
          }))}
        polls={polls
          .filter((p) => p.active)
          .map((p) => {
            const t = tally(p, votes);
            return {
              id: p.id,
              type: p.type,
              question: p.question,
              options: p.options,
              myChoice: myVotes.find((v) => v.pollId === p.id)?.choice ?? null,
              total: t.total,
              rows: t.rows,
              answers: t.answers.slice(0, 20),
            };
          })}
        questions={questions
          .filter((q) => q.active)
          .map((q) => ({
            id: q.id,
            kind: q.kind,
            question: q.question,
            // Hidden answers are never echoed back, even to their author, until the capsule opens.
            answered: myAnswers.some((a) => a.questionId === q.id),
          }))}
      />
      <Journey action="VIEW LIVE ROOM" here="PARTICIPATE" tone="violet" />
    </Content>
  );
}
