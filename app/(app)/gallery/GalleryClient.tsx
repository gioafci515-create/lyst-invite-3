"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";
import { postMedia } from "../upload";

type Item = { id: string; kind: "photo" | "video"; mine: boolean };
type Filter = "all" | "photo" | "video";

export default function GalleryClient({
  total,
  revealed,
  items,
}: {
  total: number;
  revealed: boolean;
  items: Item[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [viewing, setViewing] = useState<number | null>(null);
  const [uploading, setUploading] = useState(0);
  const [failed, setFailed] = useState<{ file: File; error: string }[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);

  const shown = items.filter((i) => filter === "all" || i.kind === filter);
  const current = viewing !== null ? shown[viewing] : null;

  const step = useCallback(
    (d: number) => setViewing((v) => (v === null || shown.length === 0 ? v : (v + d + shown.length) % shown.length)),
    [shown.length],
  );

  useEffect(() => {
    if (viewing === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewing(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [viewing, step]);

  async function upload(file: File) {
    setUploading((n) => n + 1);
    try {
      await postMedia(file, { context: "roll", source: "upload", filename: file.name });
      setFailed((f) => f.filter((x) => x.file !== file));
      router.refresh();
    } catch (err) {
      setFailed((f) => [
        ...f.filter((x) => x.file !== file),
        { file, error: err instanceof Error ? err.message : "Upload failed." },
      ]);
    } finally {
      setUploading((n) => n - 1);
    }
  }

  const photos = items.filter((i) => i.kind === "photo").length;
  const videos = items.length - photos;

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>The room, together.</h1>
          <p className={s.body}>
            Concept-specific grid, masonry, editorial presentation, filters, upload CTA, and
            full-screen viewer.
          </p>
        </div>

        <div className={s.seg} role="group" aria-label="Filter">
          {(
            [
              ["all", "ALL"],
              ["photo", "PHOTOS"],
              ["video", "VIDEOS"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              className={`${s.segBtn} ${filter === key ? s.segOn : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={s.row}>
          <span>{total} photos + videos</span>
          <label className={s.rowValue} style={{ cursor: "pointer", textDecoration: "underline" }}>
            {uploading > 0 ? `UPLOADING ${uploading}…` : "UPLOAD + · FULL-SCREEN VIEWER"}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach((f) => void upload(f));
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {!revealed && (
          <div className={s.row}>
            <span>Everyone&apos;s photos open after the event.</span>
            <span className={s.rowValue}>{items.length} YOURS</span>
          </div>
        )}

        {failed.map(({ file, error }) => (
          <div key={file.name + file.size} className={s.row} role="alert">
            <span>
              {file.name}: {error}
            </span>
            <button
              type="button"
              className={s.segBtn}
              style={{ flex: "0 0 auto", minHeight: 32 }}
              onClick={() => void upload(file)}
            >
              RETRY
            </button>
          </div>
        ))}

        {shown.length === 0 ? (
          <div className={s.row}>
            <span>Gallery empty</span>
            <span className={s.rowValue}>NO MEDIA</span>
          </div>
        ) : (
          <div className={s.grid}>
            {shown.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={s.thumb}
                onClick={() => setViewing(i)}
                aria-label={`Open ${m.kind} ${i + 1} of ${shown.length}`}
              >
                {m.kind === "video" ? (
                  <>
                    <video src={`/api/media/${m.id}#t=0.1`} muted preload="metadata" />
                    <span className={s.badge}>▶ VIDEO</span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${m.id}`} alt="" loading="lazy" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className={s.state}>
          <p className={s.stateLabel}>GALLERY STATE</p>
          <p className={s.stateText}>Filters, photos, videos, upload, and full-screen viewer.</p>
        </div>
      </section>

      <div className={s.pills}>
        {[
          { label: "FILTERS", on: filter !== "all" },
          { label: "PHOTOS", on: filter === "photo" || (filter === "all" && photos > 0) },
          { label: "VIDEOS", on: filter === "video" || (filter === "all" && videos > 0) },
          { label: "UPLOAD +", on: uploading > 0 },
          { label: "FULL-SCREEN VIEWER", on: viewing !== null },
        ].map((p) => (
          <span key={p.label} className={`${s.pill} ${p.on ? s.pillOn : ""}`}>
            {p.label}
          </span>
        ))}
      </div>

      {current && (
        <div className={s.viewer} role="dialog" aria-modal="true" aria-label="Full-screen viewer">
          <div className={s.viewerBar}>
            <span>
              {(viewing ?? 0) + 1} / {shown.length}
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <a className={s.ghost} href={`/api/media/${current.id}`} download>
                SAVE
              </a>
              <button ref={closeRef} type="button" className={s.ghost} onClick={() => setViewing(null)}>
                CLOSE
              </button>
            </span>
          </div>
          <div className={s.viewerStage}>
            {current.kind === "video" ? (
              <video key={current.id} src={`/api/media/${current.id}`} controls autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={current.id} src={`/api/media/${current.id}`} alt="" />
            )}
          </div>
          <div className={s.viewerBar} style={{ justifyContent: "center" }}>
            <button type="button" className={s.ghost} onClick={() => step(-1)} aria-label="Previous">
              ← PREV
            </button>
            <button type="button" className={s.ghost} onClick={() => step(1)} aria-label="Next">
              NEXT →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
