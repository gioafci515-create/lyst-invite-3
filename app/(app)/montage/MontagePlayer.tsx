"use client";

import { useEffect, useRef, useState } from "react";
import s from "../ui.module.css";

type Clip = { id: string; kind: "photo" | "video" };
const PHOTO_MS = 3200;

export default function MontagePlayer({
  reel,
  ready,
  progress,
}: {
  reel: Clip[];
  ready: boolean;
  progress: number;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const clip = reel[index];

  const next = () => {
    if (index >= reel.length - 1) {
      setPlaying(false);
      setFinished(true);
    } else setIndex((i) => i + 1);
  };

  // photos advance on a timer; videos advance when they end
  useEffect(() => {
    if (!playing || !clip || clip.kind !== "photo") return;
    const id = setTimeout(next, PHOTO_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index, clip]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) void v.play().catch(() => {});
    else v.pause();
  }, [playing, index]);

  function play() {
    setFinished(false);
    setPlaying(true);
  }

  function replay() {
    setIndex(0);
    setFinished(false);
    setPlaying(true);
  }

  const status = !ready
    ? `Montage processing · ${progress}%`
    : reel.length === 0
      ? "No media yet"
      : finished
        ? "The night, replayed."
        : "The night, in order.";

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>{status}</h1>
          <p className={s.body}>
            Every photo and clip from the room, played back in the order it happened.
          </p>
        </div>

        {!ready ? (
          <>
            <div className={s.bar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Montage processing">
              <div className={s.barFill} style={{ width: `${progress}%` }} />
              <div className={s.barText}>
                <span>Processing</span>
                <span>{progress}%</span>
              </div>
            </div>
            <p className={s.muted}>The montage opens when the roll is revealed after the event.</p>
          </>
        ) : reel.length === 0 ? (
          <div className={s.row}>
            <span>Gallery empty</span>
            <span className={s.rowValue}>NO MEDIA</span>
          </div>
        ) : (
          <>
            <div className={s.preview}>
              {clip.kind === "video" ? (
                <video
                  key={clip.id}
                  ref={videoRef}
                  src={`/api/media/${clip.id}`}
                  playsInline
                  onEnded={next}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={clip.id} src={`/api/media/${clip.id}`} alt="" />
              )}
              <span className={s.badge} style={{ left: 8, right: "auto", top: 8, bottom: "auto" }}>
                {index + 1} / {reel.length}
              </span>
            </div>
            <div className={s.seg}>
              <button
                type="button"
                className={`${s.segBtn} ${s.segOn}`}
                onClick={playing ? () => setPlaying(false) : play}
              >
                {playing ? "PAUSE" : "PLAY"}
              </button>
              <button type="button" className={s.segBtn} onClick={replay}>
                REPLAY
              </button>
              <a className={s.segBtn} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }} href={`/api/media/${clip.id}`} download>
                SAVE
              </a>
            </div>
          </>
        )}
      </section>

      <div className={s.pills}>
        {[
          { label: "MONTAGE PROCESSING", on: !ready },
          { label: "READY", on: ready && reel.length > 0 },
          { label: "WATCH", on: playing },
          { label: "REPLAY", on: finished },
          { label: "SHARE / DOWNLOAD", on: ready && reel.length > 0 },
        ].map((p) => (
          <span key={p.label} className={`${s.pill} ${p.on ? s.pillOn : ""}`}>
            {p.label}
          </span>
        ))}
      </div>
    </>
  );
}
