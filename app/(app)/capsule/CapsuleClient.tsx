"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";
import Countdown from "../countdown";

type Archive = {
  media: { id: string; kind: "photo" | "video" | "voice"; context: string }[];
  letters: { id: string; text: string; author: string }[];
  messages: { id: string; text: string; author: string; photoId: string }[];
  answers: { id: string; question: string; text: string }[];
};

export default function CapsuleClient({
  counts,
  sealed: initiallySealed,
  unlocked,
  unlockIso,
  unlockLabel,
  initialCountdown,
  archive,
}: {
  counts: { photos: number; videos: number; voices: number; writing: number; answers: number };
  sealed: boolean;
  unlocked: boolean;
  unlockIso: string;
  unlockLabel: string;
  initialCountdown: string;
  archive: Archive | null;
}) {
  const router = useRouter();
  const [sealed, setSealed] = useState(initiallySealed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function seal() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/capsule", { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not seal.");
      setSealed(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const summary = `${counts.photos} photos · ${counts.videos} video · ${counts.voices} voice · ${counts.writing} writing · ${counts.answers} answers`;

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>A future room, made from this one.</h1>
          <p className={s.body}>
            Create with {counts.photos} photos, {counts.videos} video, {counts.voices} voice,{" "}
            {counts.writing} writing, and {counts.answers} answers. Unlock {unlockLabel}.
          </p>
        </div>

        <div className={s.stack}>
          <div className={s.row}>
            <span>{summary}</span>
            <span className={s.rowValue}>UNLOCK DATE</span>
          </div>
          <div className={s.row}>
            <span>
              {unlocked ? (
                "Capsule is open"
              ) : (
                <>
                  Countdown <Countdown to={unlockIso} initial={initialCountdown} />
                </>
              )}
            </span>
            <span className={s.rowValue}>{unlocked ? "UNLOCKED" : "LOCKED"}</span>
          </div>
          <div className={s.row}>
            <span>Locked archive reveals film, voices, letters, and answers</span>
            <span className={s.rowValue}>
              {unlocked ? "✓ REVEAL" : sealed ? "SEALED BY YOU" : "REVEAL"}
            </span>
          </div>
        </div>

        {!unlocked && (
          <button type="button" className={s.primary} onClick={seal} disabled={sealed || busy}>
            {sealed ? "✓ CAPSULE SEALED" : busy ? "Sealing…" : "SEAL CAPSULE"}
          </button>
        )}
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}

        <div className={s.state}>
          <p className={s.stateLabel}>CAPSULE STATE</p>
          <p className={s.stateText}>
            Create, media + answers, unlock date, countdown, locked, and reveal.
          </p>
        </div>
      </section>

      {archive && (
        <section className={s.card} aria-label="Capsule archive">
          <div className={s.head}>
            <h2 className={s.title} style={{ fontSize: 18 }}>
              The archive
            </h2>
          </div>

          {archive.media.some((m) => m.kind !== "voice") && (
            <div className={s.grid}>
              {archive.media
                .filter((m) => m.kind !== "voice")
                .map((m) => (
                  <div key={m.id} className={s.thumb}>
                    {m.kind === "video" ? (
                      <video src={`/api/media/${m.id}`} controls preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${m.id}`} alt="" loading="lazy" />
                    )}
                  </div>
                ))}
            </div>
          )}

          {archive.media.filter((m) => m.kind === "voice").map((m, i) => (
            <div key={m.id} className={s.stack}>
              <span className={s.muted}>Voice memory {i + 1}</span>
              <audio src={`/api/media/${m.id}`} controls preload="none" style={{ width: "100%" }} />
            </div>
          ))}

          {archive.messages.map((m) => (
            <p key={m.id} className={s.quote}>
              {m.text}
              {m.photoId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/media/${m.photoId}`}
                  alt=""
                  style={{ display: "block", width: "100%", marginTop: 10, borderRadius: 8 }}
                />
              )}
              <span className={s.quoteMeta}>— {m.author}, to the future</span>
            </p>
          ))}
          {archive.letters.map((l) => (
            <p key={l.id} className={s.quote}>
              {l.text}
              <span className={s.quoteMeta}>— {l.author}</span>
            </p>
          ))}
          {archive.answers.map((a) => (
            <p key={a.id} className={s.quote}>
              <strong>{a.question}</strong>
              <br />
              {a.text}
            </p>
          ))}
        </section>
      )}

      <div className={s.pills}>
        {[
          { label: "CREATE", on: !sealed && !unlocked },
          { label: "MEDIA + ANSWERS", on: counts.photos + counts.videos + counts.voices + counts.answers > 0 },
          { label: "UNLOCK DATE", on: true },
          { label: "COUNTDOWN", on: !unlocked },
          { label: "LOCKED", on: !unlocked && sealed },
          { label: "REVEAL", on: unlocked, check: true },
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
