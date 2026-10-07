import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import {
  listAnswers,
  listChallenges,
  listCompletions,
  listFutureMessages,
  listLetters,
  listMedia,
  listPolls,
  listQuestions,
  listSeals,
  listVotes,
  tally,
} from "@/lib/store";
import { removeLetter, removeMedia } from "../actions";
import AdminNav from "../AdminNav";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Submissions — Admin",
  robots: { index: false, follow: false },
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

async function SubmissionsAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [media, letters, messages, answers, questions, polls, votes, challenges, completions, seals] =
    await Promise.all([
      listMedia(),
      listLetters(),
      listFutureMessages(),
      listAnswers(),
      listQuestions(),
      listPolls(),
      listVotes(),
      listChallenges(),
      listCompletions(),
      listSeals(),
    ]);
  const qText = new Map(questions.map((q) => [q.id, q.question]));
  const label: Record<string, string> = {
    roll: "Camera roll",
    guestbook: "Voice guestbook",
    video: "Video message",
    future: "Message photo",
  };

  return (
    <main className={styles.page}>
      <AdminNav current="submissions" title="Submissions" />

      <section className={styles.stats} aria-label="Summary">
        <div className={styles.stat}>
          <span className={styles.statNum}>{media.length}</span>
          <span className={styles.statLabel}>Media</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{letters.length}</span>
          <span className={styles.statLabel}>Letters</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{messages.length}</span>
          <span className={styles.statLabel}>Future messages</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{seals.length}</span>
          <span className={styles.statLabel}>Capsules sealed</span>
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Media</h2>
        {media.length === 0 && <p className={styles.empty}>Nothing uploaded yet.</p>}
        <div className={styles.mediaGrid}>
          {media.map((m) => (
            <div key={m.id} className={styles.mediaCard}>
              {m.kind === "photo" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media/${m.id}`} alt="" loading="lazy" />
              )}
              {m.kind === "video" && <video src={`/api/media/${m.id}`} controls preload="metadata" />}
              {m.kind === "voice" && <audio src={`/api/media/${m.id}`} controls preload="none" />}
              <p className={styles.hint}>
                {label[m.context]} · {m.kind}
                {m.seconds ? ` · ${Math.round(m.seconds)}s` : ""} · {fmt.format(new Date(m.createdAt))}
              </p>
              <form action={removeMedia}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className={styles.delete}>
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Letters from the room</h2>
        {letters.length === 0 && <p className={styles.empty}>No letters yet.</p>}
        {letters.map((l) => (
          <div key={l.id} className={styles.item}>
            <p>
              {l.text}
              <br />
              <span className={styles.hint}>
                {l.anonymous ? `Anonymous (sent by a guest)` : l.name} · {fmt.format(new Date(l.createdAt))}
              </span>
            </p>
            <form action={removeLetter}>
              <input type="hidden" name="id" value={l.id} />
              <button type="submit" className={styles.delete}>
                Delete
              </button>
            </form>
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Messages for later</h2>
        {messages.length === 0 && <p className={styles.empty}>No sealed messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={styles.item}>
            <p>
              {m.text}
              <br />
              <span className={styles.hint}>
                {m.name || "A guest"} · reveals {fmt.format(new Date(m.revealAt))}
                {m.photoId ? " · with photo" : ""}
              </span>
            </p>
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Poll results</h2>
        {polls.map((p) => {
          const t = tally(p, votes);
          return (
            <div key={p.id} className={styles.item}>
              <div>
                <strong>{p.question}</strong> · {t.total} {t.total === 1 ? "vote" : "votes"}
                <ul className={styles.list}>
                  {p.type === "open"
                    ? t.answers.map((a, i) => <li key={i}>{a}</li>)
                    : t.rows.map((r) => (
                        <li key={r.option}>
                          {r.option}: {r.count} ({r.percent}%)
                        </li>
                      ))}
                </ul>
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Host question answers</h2>
        {answers.length === 0 && <p className={styles.empty}>No answers yet.</p>}
        {answers.map((a) => (
          <div key={a.id} className={styles.item}>
            <p>
              <strong>{qText.get(a.questionId) ?? "Removed question"}</strong>
              <br />
              {a.text}
              <br />
              <span className={styles.hint}>{fmt.format(new Date(a.createdAt))}</span>
            </p>
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Challenge completions</h2>
        {challenges.map((c) => (
          <p key={c.id} className={styles.item}>
            <span>
              <strong>{c.title}</strong> — {completions.filter((x) => x.challengeId === c.id).length} completed
            </span>
          </p>
        ))}
      </section>
    </main>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<main className={styles.page} aria-busy="true" />}>
      <SubmissionsAdmin />
    </Suspense>
  );
}
