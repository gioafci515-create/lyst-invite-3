"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";

type PollType = "choice" | "yesno" | "open";
type Poll = {
  id: string;
  type: PollType;
  question: string;
  options: string[];
  myChoice: string | null;
  total: number;
  rows: { option: string; count: number; percent: number }[];
  answers: string[];
};
type Challenge = { id: string; title: string; description: string; done: boolean };
type Question = { id: string; kind: "short" | "long" | "hidden"; question: string; answered: boolean };
type Letter = { id: string; text: string; author: string };

type Section = "letters" | "challenges" | "polls" | "questions" | null;

async function send(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    return (await res.json().catch(() => ({}))).error || "Something went wrong.";
  } catch {
    return "Network problem. Try again.";
  }
}

export default function InteractionHub({
  announcement,
  letters,
  challenges,
  polls,
  questions,
}: {
  announcement: string | null;
  letters: Letter[];
  challenges: Challenge[];
  polls: Poll[];
  questions: Question[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  // letters form
  const [letter, setLetter] = useState("");
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  // open answers
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function act(key: string, url: string, body: unknown, after?: () => void) {
    setBusy(key);
    setError("");
    const err = await send(url, body);
    setBusy("");
    if (err) {
      setError(err);
      return;
    }
    after?.();
    router.refresh();
  }

  const toggle = (k: Exclude<Section, null>) => setOpen((o) => (o === k ? null : k));

  const anyDone = challenges.some((c) => c.done);
  const allDone = challenges.length > 0 && challenges.every((c) => c.done);
  const voted = polls.filter((p) => p.myChoice !== null).length;
  const lead = polls.find((p) => p.type !== "open" && p.total > 0);
  const leadPct = lead ? Math.max(...lead.rows.map((r) => r.percent)) : 0;
  const hiddenAnswered = questions.some((q) => q.kind === "hidden" && q.answered);

  const rowBtn = (k: Exclude<Section, null>, label: string, value: string) => (
    <button
      type="button"
      className={`${s.row} ${open === k ? s.rowOpen : ""}`}
      onClick={() => toggle(k)}
      aria-expanded={open === k}
    >
      <span className={s.rowLabel}>{label}</span>
      <span className={s.rowValue}>{value}</span>
    </button>
  );

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>
            {announcement ? `Host announcement · ${announcement}` : "The room is open."}
          </h1>
          <p className={s.body}>
            Letters, challenges, polls, and host questions in one live room.
          </p>
        </div>

        <div className={s.stack}>
          {rowBtn("letters", "Letters from the room", "NAMED / ANONYMOUS")}
          {open === "letters" && (
            <div className={s.panel}>
              <form
                className={s.stack}
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("letter", "/api/letters", { text: letter, name, anonymous: anon }, () =>
                    setLetter(""),
                  );
                }}
              >
                <textarea
                  className={s.textarea}
                  aria-label="Your letter"
                  placeholder="Write a letter to the room…"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  maxLength={1000}
                />
                {!anon && (
                  <input
                    className={s.input}
                    aria-label="Your name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                )}
                <label className={s.check}>
                  <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
                  Send anonymously
                </label>
                <button type="submit" className={s.primary} disabled={busy === "letter"}>
                  {busy === "letter" ? "Sending…" : "SEND LETTER"}
                </button>
              </form>
              {letters.length === 0 ? (
                <p className={s.muted}>No letters yet. Be the first.</p>
              ) : (
                letters.map((l) => (
                  <p key={l.id} className={s.quote}>
                    {l.text}
                    <span className={s.quoteMeta}>— {l.author}</span>
                  </p>
                ))
              )}
            </div>
          )}

          {rowBtn(
            "challenges",
            "Hidden moments",
            challenges.length === 0
              ? "NO ACTIVE CHALLENGE"
              : allDone
                ? "COMPLETED"
                : "CHALLENGE ACTIVE",
          )}
          {open === "challenges" && (
            <div className={s.panel}>
              {challenges.length === 0 && <p className={s.muted}>No active challenge right now.</p>}
              {challenges.map((c) => (
                <div key={c.id} className={s.stack}>
                  <strong>{c.title}</strong>
                  <p className={s.body}>{c.description}</p>
                  <button
                    type="button"
                    className={`${s.segBtn} ${c.done ? s.segOn : ""}`}
                    disabled={c.done || busy === c.id}
                    onClick={() => act(c.id, "/api/challenges", { challengeId: c.id })}
                  >
                    {c.done ? "✓ COMPLETED" : busy === c.id ? "Saving…" : "MARK COMPLETE"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {rowBtn("polls", "Live polls", "MULTIPLE CHOICE · YES/NO · OPEN ANSWER")}
          {open === "polls" && (
            <div className={s.panel}>
              {polls.length === 0 && <p className={s.muted}>No active poll.</p>}
              {polls.map((p) => (
                <div key={p.id} className={s.stack}>
                  <strong>{p.question}</strong>
                  {p.myChoice === null ? (
                    p.type === "open" ? (
                      <form
                        className={s.stack}
                        onSubmit={(e) => {
                          e.preventDefault();
                          void act(p.id, "/api/votes", { pollId: p.id, choice: drafts[p.id] ?? "" });
                        }}
                      >
                        <input
                          className={s.input}
                          aria-label={p.question}
                          value={drafts[p.id] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                          maxLength={200}
                          placeholder="Your answer"
                        />
                        <button type="submit" className={s.primary} disabled={busy === p.id}>
                          SUBMIT ANSWER
                        </button>
                      </form>
                    ) : (
                      <div className={p.type === "yesno" ? s.seg : s.stack}>
                        {p.options.map((o) => (
                          <button
                            key={o}
                            type="button"
                            className={s.segBtn}
                            disabled={busy === p.id}
                            onClick={() => act(p.id, "/api/votes", { pollId: p.id, choice: o })}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    )
                  ) : p.type === "open" ? (
                    <div className={s.stack}>
                      <p className={s.muted}>VOTE LOCKED · you said “{p.myChoice}”</p>
                      {p.answers.map((a, i) => (
                        <p key={i} className={s.quote}>{a}</p>
                      ))}
                    </div>
                  ) : (
                    <div className={s.stack}>
                      {p.rows.map((r) => (
                        <div key={r.option} className={s.bar}>
                          <div className={s.barFill} style={{ width: `${r.percent}%` }} />
                          <div className={s.barText} style={{ color: "#fff" }}>
                            <span>
                              {r.option}
                              {r.option === p.myChoice ? " ✓" : ""}
                            </span>
                            <span>{r.percent}%</span>
                          </div>
                        </div>
                      ))}
                      <p className={s.muted}>
                        VOTE LOCKED · {p.total} {p.total === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {rowBtn("questions", "Host questions", "SHORT · LONG · HIDDEN · REVEAL LATER")}
          {open === "questions" && (
            <div className={s.panel}>
              {questions.length === 0 && <p className={s.muted}>No questions from the host yet.</p>}
              {questions.map((q) => (
                <div key={q.id} className={s.stack}>
                  <strong>{q.question}</strong>
                  {q.kind === "hidden" && (
                    <p className={s.muted}>HIDDEN · your answer is revealed later, with the capsule.</p>
                  )}
                  {q.answered ? (
                    <p className={s.muted}>✓ Answer saved{q.kind === "hidden" ? " and hidden" : ""}.</p>
                  ) : (
                    <form
                      className={s.stack}
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act(q.id, "/api/answers", { questionId: q.id, text: drafts[q.id] ?? "" });
                      }}
                    >
                      {q.kind === "short" ? (
                        <input
                          className={s.input}
                          aria-label={q.question}
                          value={drafts[q.id] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                          maxLength={200}
                        />
                      ) : (
                        <textarea
                          className={s.textarea}
                          aria-label={q.question}
                          value={drafts[q.id] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                          maxLength={2000}
                        />
                      )}
                      <button type="submit" className={s.primary} disabled={busy === q.id}>
                        {busy === q.id ? "Saving…" : "SAVE ANSWER"}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}

        <div className={s.state}>
          <p className={s.stateLabel}>HUB STATE</p>
          <p className={s.stateText}>Announcement, letters, challenge, voted, live, and hidden.</p>
        </div>
      </section>

      <div className={s.pills}>
        {[
          { label: "ANNOUNCEMENT", on: Boolean(announcement) },
          { label: "LETTERS", on: letters.length > 0 },
          { label: "CHALLENGE", on: anyDone, check: true },
          { label: "VOTED", on: voted > 0, check: true },
          { label: lead ? `LIVE ${leadPct}%` : "LIVE", on: Boolean(lead) },
          { label: "HIDDEN", on: hiddenAnswered },
        ].map((p) => (
          <span key={p.label} className={`${s.pill} ${p.on ? s.pillOn : ""}`}>
            {p.check && p.on && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/images/check.svg" alt="" width={16} height={16} />
            )}
            {p.label}
          </span>
        ))}
      </div>
    </>
  );
}
