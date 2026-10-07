import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import {
  listAnnouncements,
  listChallenges,
  listNotices,
  listPolls,
  listQuestions,
} from "@/lib/store";
import {
  createChallenge,
  createNotice,
  createPoll,
  createQuestion,
  removeAnnouncement,
  removeChallenge,
  removeNotice,
  removePoll,
  removeQuestion,
  setAnnouncement,
  toggleChallenge,
  togglePoll,
  toggleQuestion,
} from "../actions";
import AdminNav from "../AdminNav";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Live content — Admin",
  robots: { index: false, follow: false },
};

function Toggle({
  id,
  active,
  action,
}: {
  id: string;
  active: boolean;
  action: (f: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={String(!active)} />
      <button type="submit" className={styles.secondary}>
        {active ? "Pause" : "Activate"}
      </button>
    </form>
  );
}

function Remove({ id, action, label }: { id: string; action: (f: FormData) => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={styles.delete} aria-label={`Delete ${label}`}>
        Delete
      </button>
    </form>
  );
}

async function ContentAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [announcements, notices, polls, challenges, questions] = await Promise.all([
    listAnnouncements(),
    listNotices(),
    listPolls(),
    listChallenges(),
    listQuestions(),
  ]);
  const live = announcements.find((a) => a.active);

  return (
    <main className={styles.page}>
      <AdminNav current="content" title="Live content" />

      <section className={styles.block}>
        <h2 className={styles.h2}>Host announcement</h2>
        <p className={styles.hint}>Shown in the live room and on the event hub.</p>
        {live && (
          <div className={styles.item}>
            <p>{live.text}</p>
            <form action={removeAnnouncement}>
              <button type="submit" className={styles.delete}>
                Clear
              </button>
            </form>
          </div>
        )}
        <form action={setAnnouncement} className={styles.form}>
          <input name="text" className={styles.input} placeholder="Dinner is served in 18 minutes." maxLength={300} required />
          <button type="submit" className={styles.primary}>
            {live ? "Replace announcement" : "Post announcement"}
          </button>
        </form>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Notifications</h2>
        <p className={styles.hint}>Appear in guests&apos; Updates. Priority ones are pinned first.</p>
        {notices.map((n) => (
          <div key={n.id} className={styles.item}>
            <p>
              <strong>{n.kind}</strong>
              {n.priority ? " · priority" : ""} — {n.title}
              <br />
              <span className={styles.hint}>{n.detail}</span>
            </p>
            <Remove id={n.id} action={removeNotice} label={n.title} />
          </div>
        ))}
        <form action={createNotice} className={styles.form}>
          <select name="kind" className={styles.input} defaultValue="host" aria-label="Type">
            <option value="host">Host announcement</option>
            <option value="location">Location change</option>
            <option value="schedule">Schedule change</option>
            <option value="rsvp">RSVP reminder</option>
            <option value="activity">Activity</option>
            <option value="capsule">Capsule unlock</option>
          </select>
          <input name="title" className={styles.input} placeholder="Title" maxLength={120} required />
          <input name="detail" className={styles.input} placeholder="Details" maxLength={600} />
          <label className={styles.check}>
            <input type="checkbox" name="priority" /> Priority
          </label>
          <button type="submit" className={styles.primary}>
            Send notification
          </button>
        </form>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Polls</h2>
        {polls.map((p) => (
          <div key={p.id} className={styles.item}>
            <p>
              <strong>{p.question}</strong> · {p.type}
              {p.options.length ? ` · ${p.options.join(" / ")}` : ""}
              {p.active ? "" : " · paused"}
            </p>
            <div className={styles.actions}>
              <Toggle id={p.id} active={p.active} action={togglePoll} />
              <Remove id={p.id} action={removePoll} label={p.question} />
            </div>
          </div>
        ))}
        <form action={createPoll} className={styles.form}>
          <select name="type" className={styles.input} defaultValue="choice" aria-label="Poll type">
            <option value="choice">Multiple choice</option>
            <option value="yesno">Yes / No</option>
            <option value="open">Open answer</option>
          </select>
          <input name="question" className={styles.input} placeholder="Question" maxLength={200} required />
          <textarea
            name="options"
            className={styles.input}
            placeholder={"Options, one per line (multiple choice only)"}
            rows={3}
          />
          <button type="submit" className={styles.primary}>
            Add poll
          </button>
        </form>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Hidden-moment challenges</h2>
        {challenges.map((c) => (
          <div key={c.id} className={styles.item}>
            <p>
              <strong>{c.title}</strong>
              {c.active ? "" : " · paused"}
              <br />
              <span className={styles.hint}>{c.description}</span>
            </p>
            <div className={styles.actions}>
              <Toggle id={c.id} active={c.active} action={toggleChallenge} />
              <Remove id={c.id} action={removeChallenge} label={c.title} />
            </div>
          </div>
        ))}
        <form action={createChallenge} className={styles.form}>
          <input name="title" className={styles.input} placeholder="Title" maxLength={120} required />
          <input name="description" className={styles.input} placeholder="What should guests do?" maxLength={400} />
          <button type="submit" className={styles.primary}>
            Add challenge
          </button>
        </form>
      </section>

      <section className={styles.block}>
        <h2 className={styles.h2}>Host questions</h2>
        <p className={styles.hint}>Hidden answers stay private until the capsule opens.</p>
        {questions.map((q) => (
          <div key={q.id} className={styles.item}>
            <p>
              <strong>{q.question}</strong> · {q.kind}
              {q.active ? "" : " · paused"}
            </p>
            <div className={styles.actions}>
              <Toggle id={q.id} active={q.active} action={toggleQuestion} />
              <Remove id={q.id} action={removeQuestion} label={q.question} />
            </div>
          </div>
        ))}
        <form action={createQuestion} className={styles.form}>
          <select name="kind" className={styles.input} defaultValue="short" aria-label="Question type">
            <option value="short">Short answer</option>
            <option value="long">Long answer</option>
            <option value="hidden">Hidden (reveal later)</option>
          </select>
          <input name="question" className={styles.input} placeholder="Question" maxLength={300} required />
          <button type="submit" className={styles.primary}>
            Add question
          </button>
        </form>
      </section>
    </main>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<main className={styles.page} aria-busy="true" />}>
      <ContentAdmin />
    </Suspense>
  );
}
