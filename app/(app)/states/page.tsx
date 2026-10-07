import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import {
  getRsvpByGuest,
  isRevealed,
  listChallenges,
  listCompletions,
  listMedia,
  listPolls,
  listRsvps,
  listVotes,
} from "@/lib/store";
import { DISPOSABLE_SHOTS } from "@/lib/media";
import { EVENT, revealAt } from "@/lib/event";
import { Content, Journey, Loading, Row, StateBox } from "../ui";
import s from "../ui.module.css";

export default function StatesPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <StatesContent />
    </Suspense>
  );
}

function montageProgress(now: Date) {
  const end = revealAt().getTime();
  const start = EVENT.start.getTime();
  if (now.getTime() >= end) return 100;
  return Math.max(0, Math.min(99, Math.round(((now.getTime() - start) / (end - start)) * 100)));
}

async function StatesContent() {
  await connection();
  const now = new Date();
  const guestId = await getGuestId();
  const [rsvp, rsvps, challenges, completions, polls, votes, media] = await Promise.all([
    guestId ? getRsvpByGuest(guestId) : null,
    listRsvps(),
    listChallenges(),
    listCompletions(),
    listPolls(),
    listVotes(),
    listMedia(),
  ]);

  const closed = now > EVENT.rsvpDeadline;
  const roll = media.filter((m) => m.context === "roll");
  const myShots = roll.filter((m) => guestId && m.guestId === guestId && m.source === "capture").length;
  const activeChallenges = challenges.filter((c) => c.active);
  const myDone = new Set(completions.filter((c) => c.guestId === guestId).map((c) => c.challengeId));
  const activePolls = polls.filter((p) => p.active);
  const voters = new Set(votes.map((v) => v.guestId)).size;
  const attending = rsvps.filter((r) => r.attendance === "accept").length;
  const votedPct = Math.round((voters / Math.max(attending, voters, 1)) * 100);
  const iVoted = votes.some((v) => v.guestId === guestId);
  const revealed = isRevealed(now);
  const progress = montageProgress(now);

  const challengeState =
    activeChallenges.length === 0
      ? "NONE"
      : activeChallenges.every((c) => myDone.has(c.id))
        ? "COMPLETED"
        : "ACTIVE";

  return (
    <Content>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title} style={{ fontSize: 18 }}>
            Respond States
          </h1>
        </div>
        <div className={s.stack}>
          <Row label="RSVP plus-one" value="ADD GUEST" href="/respond" />
          <Row label="Deadline" value="24 DEC · 18:00" />
          <Row label="Edit" value="UPDATE RESPONSE" href="/respond" />
          <Row label="Already submitted" value={rsvp ? "NO CHANGES NEEDED" : "NOT YET"} href="/respond" />
          <Row label="Closed" value={closed ? "RSVP CLOSED" : "OPEN"} />
          <Row label="Validation" value="REQUIRED FIELD" />
        </div>
      </section>

      <section className={s.card}>
        <div className={s.head}>
          <h2 className={s.title} style={{ fontSize: 18 }}>
            Participate States
          </h2>
        </div>
        <div className={s.stack}>
          <Row label="Camera retake" value={`RETAKE · ${Math.max(0, DISPOSABLE_SHOTS - myShots)} SHOTS LEFT`} href="/camera" />
          <Row label="Failure" value="TRY AGAIN" />
          <Row label="Permission" value="ALLOW CAMERA" href="/camera" />
          <Row label="No active challenge" value={challengeState} href="/interact" />
          <Row label="Poll results" value={`${votedPct}% VOTED`} href="/interact" />
          <Row label="Already voted" value={iVoted ? "VOTE LOCKED" : "OPEN"} href="/interact" />
          <Row label="No active poll" value={activePolls.length ? `${activePolls.length} ACTIVE` : "NONE"} href="/interact" />
          <Row label="Gallery empty" value={roll.length ? `${roll.length} ITEMS` : "NO MEDIA"} href="/gallery" />
        </div>
      </section>

      <section className={s.card}>
        <div className={s.head}>
          <h2 className={s.title} style={{ fontSize: 18 }}>
            Remember States
          </h2>
        </div>
        <div className={s.stack}>
          <Row label="Failed upload" value="RETRY" href="/gallery" />
          <Row label="Contributors" value={`${new Set(roll.map((m) => m.guestId)).size} GUESTS · ${roll.filter((m) => m.kind === "photo").length} PHOTOS`} />
          <Row label="Montage processing" value={`${progress}%`} href="/montage" />
          <Row label="Ready" value={revealed ? "WATCH NOW" : "NOT YET"} href="/montage" />
          <Row label="Watch" value="PLAY" href="/montage" />
          <Row label="Replay" value="REPLAY" href="/montage" />
          <Row label="Share/download" value="SAVE" href="/gallery" />
        </div>
        <StateBox label="RETURN PATHS">
          <Link href="/respond">RSVP → Edit</Link> · <Link href="/camera">Camera → Retake</Link> ·{" "}
          <Link href="/interact">Poll → Results</Link> · <Link href="/gallery">Gallery → Retry</Link> ·{" "}
          <Link href="/capsule">Capsule → Contributors</Link> · <Link href="/montage">Montage → Watch</Link> ·{" "}
          <Link href="/gallery">Share → Save</Link>.
        </StateBox>
      </section>

      <Journey action="VIEW ALL STATES" />
    </Content>
  );
}
