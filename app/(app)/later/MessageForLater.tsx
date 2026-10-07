"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";
import Countdown from "../countdown";
import { postMedia } from "../upload";

type Mine = { id: string; text: string | null; photoId: string; createdAt: string };

export default function MessageForLater({
  unlocked,
  unlockIso,
  unlockLabel,
  initialCountdown,
  mine,
}: {
  unlocked: boolean;
  unlockIso: string;
  unlockLabel: string;
  initialCountdown: string;
  mine: Mine[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [justSealed, setJustSealed] = useState(false);

  async function seal(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Write your message first.");
      return;
    }
    setSending(true);
    setError("");
    try {
      let photoId = "";
      if (photo) {
        photoId = await postMedia(photo, {
          context: "future",
          source: "upload",
          filename: photo.name,
        });
      }
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, name, photoId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not seal your message.");
      }
      setText("");
      setPhoto(null);
      setJustSealed(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  const sealed = mine.length > 0;

  return (
    <>
      <form className={s.card} onSubmit={seal}>
        <div className={s.head}>
          <h1 className={s.title}>“Keep choosing the long table…”</h1>
          <p className={s.body}>
            Written message, optional photo, future reveal, and countdown until {unlockLabel}.
          </p>
        </div>

        <div className={s.stack}>
          <div className={s.field}>
            <label className={s.fieldLabelSm} htmlFor="msg">
              WRITTEN MESSAGE
            </label>
            <textarea
              id="msg"
              className={s.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Keep choosing the long table, the late night, and the people who stay."
              maxLength={2000}
              disabled={unlocked}
            />
          </div>

          <div className={s.field}>
            <label className={s.fieldLabelSm} htmlFor="who">
              YOUR NAME (OPTIONAL)
            </label>
            <input
              id="who"
              className={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
            />
          </div>

          <div className={s.field}>
            <span className={s.fieldLabelSm}>OPTIONAL PHOTO</span>
            <label className={s.row} style={{ cursor: "pointer" }}>
              <span>{photo ? photo.name : "Add photo"}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/plus.svg" alt="" width={16} height={16} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabelSm}>FUTURE REVEAL</span>
            <div className={s.row}>
              <span>{unlockLabel}</span>
              <span className={s.rowValue}>
                {unlocked ? (
                  "REVEALED"
                ) : (
                  <>
                    COUNTDOWN <Countdown to={unlockIso} initial={initialCountdown} />
                  </>
                )}
              </span>
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>SUBMITTED</span>
            <div className={s.row}>
              <span>Locked immediately</span>
              <span className={s.rowValue}>{sealed ? "LOCKED" : "NOT YET"}</span>
            </div>
          </div>
        </div>

        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}

        {!unlocked && (
          <button type="submit" className={s.primary} disabled={sending}>
            {sending ? "Sealing…" : "SEAL MESSAGE"}
          </button>
        )}

        <div className={s.state}>
          <p className={s.stateLabel}>MESSAGE STATE</p>
          <p className={s.stateText}>
            {justSealed
              ? "Sealed. Your message is locked and cannot be read or changed until the reveal."
              : "Written, optional photo, date, submitted, locked, countdown, and reveal."}
          </p>
        </div>
      </form>

      {sealed && (
        <section className={s.card} aria-label="Your sealed messages">
          <div className={s.head}>
            <h2 className={s.title} style={{ fontSize: 18 }}>
              Your sealed messages
            </h2>
          </div>
          {mine.map((m) =>
            m.text === null ? (
              <div key={m.id} className={s.row}>
                <span>Sealed {new Date(m.createdAt).toLocaleDateString("en-GB")}</span>
                <span className={s.rowValue}>LOCKED</span>
              </div>
            ) : (
              <p key={m.id} className={s.quote}>
                {m.text}
                {m.photoId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${m.photoId}`}
                    alt="Photo sent with your message"
                    style={{ display: "block", width: "100%", marginTop: 10, borderRadius: 8 }}
                  />
                )}
              </p>
            ),
          )}
        </section>
      )}

      <div className={s.pills}>
        {[
          { label: "WRITTEN", on: text.trim().length > 0 },
          { label: "OPTIONAL PHOTO", on: Boolean(photo) },
          { label: "DATE", on: true },
          { label: "SUBMITTED", on: sealed },
          { label: "LOCKED", on: sealed && !unlocked },
          { label: "COUNTDOWN", on: !unlocked },
          { label: "REVEAL", on: unlocked },
        ].map((p) => (
          <span key={p.label} className={`${s.pill} ${p.on ? s.pillOn : ""}`}>
            {p.label}
          </span>
        ))}
      </div>
    </>
  );
}
