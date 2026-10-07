"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";
import { postMedia } from "../upload";

type Mine = { id: string; kind: "photo" | "video" | "voice" };
type Tab = "capture" | "upload";
type CamState = "off" | "starting" | "on" | "denied" | "unsupported";
type Job = { key: number; name: string; status: "uploading" | "failed"; blob: Blob; source: "capture" | "upload"; error?: string };

export default function CameraClient({
  totalPhotos,
  revealed,
  shotsLeft,
  mine,
}: {
  totalPhotos: number;
  revealed: boolean;
  shotsLeft: number;
  mine: Mine[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("capture");
  const [cam, setCam] = useState<CamState>("off");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [left, setLeft] = useState(shotsLeft);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keyRef = useRef(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCam("off");
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (cam === "on" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [cam]);

  async function start() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam("unsupported");
      return;
    }
    setCam("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCam("on");
    } catch {
      setCam("denied");
    }
  }

  const run = useCallback(
    async (job: Job) => {
      try {
        await postMedia(job.blob, {
          context: "roll",
          source: job.source,
          filename: job.name,
        });
        setJobs((j) => j.filter((x) => x.key !== job.key));
        router.refresh();
      } catch (err) {
        setJobs((j) =>
          j.map((x) =>
            x.key === job.key
              ? { ...x, status: "failed", error: err instanceof Error ? err.message : "Failed" }
              : x,
          ),
        );
        if (job.source === "capture") setLeft((n) => n + 1);
      }
    },
    [router],
  );

  function enqueue(blob: Blob, name: string, source: "capture" | "upload") {
    const job: Job = { key: ++keyRef.current, name, status: "uploading", blob, source };
    setJobs((j) => [...j, job]);
    void run(job);
  }

  function retry(job: Job) {
    if (job.source === "capture") setLeft((n) => n - 1);
    setJobs((j) => j.map((x) => (x.key === job.key ? { ...x, status: "uploading" } : x)));
    void run({ ...job, status: "uploading" });
  }

  function shutter() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    if (left <= 0) {
      setMessage("Your disposable camera is full. You can still upload photos.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setLeft((n) => n - 1);
        enqueue(blob, `shot-${Date.now()}.jpg`, "capture");
      },
      "image/jpeg",
      0.9,
    );
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => enqueue(f, f.name, "upload"));
  }

  async function remove(id: string) {
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setMessage("Could not remove that item.");
  }

  const uploading = jobs.filter((j) => j.status === "uploading").length;
  const failed = jobs.filter((j) => j.status === "failed");

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>Capture the room as it happens.</h1>
          <p className={s.body}>
            Disposable mode, upload existing, and private roll management for the live event.
          </p>
        </div>

        <div className={s.seg} role="tablist" aria-label="Camera mode">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "capture"}
            className={`${s.segBtn} ${tab === "capture" ? s.segOn : ""}`}
            onClick={() => setTab("capture")}
          >
            CAPTURE
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upload"}
            className={`${s.segBtn} ${tab === "upload" ? s.segOn : ""}`}
            onClick={() => {
              stop();
              setTab("upload");
            }}
          >
            UPLOAD
          </button>
        </div>

        {tab === "capture" ? (
          <div className={s.stack}>
            {cam === "on" || cam === "starting" ? (
              <div className={s.preview}>
                <video ref={videoRef} playsInline muted aria-label="Camera preview" />
              </div>
            ) : null}

            {cam === "on" ? (
              <div className={s.seg}>
                <button type="button" className={`${s.segBtn} ${s.segOn}`} onClick={shutter} disabled={left <= 0}>
                  SNAP · {left} LEFT
                </button>
                <button type="button" className={s.segBtn} onClick={stop}>
                  CLOSE
                </button>
              </div>
            ) : (
              <button type="button" className={s.primary} onClick={start} disabled={cam === "starting"}>
                {cam === "starting" ? "Starting…" : "OPEN CAMERA"}
              </button>
            )}

            {cam === "denied" && (
              <div className={s.row}>
                <span>Permission</span>
                <span className={s.rowValue}>ALLOW CAMERA IN YOUR BROWSER</span>
              </div>
            )}
            {(cam === "unsupported" || cam === "denied") && (
              <label className={s.ghost} style={{ cursor: "pointer" }}>
                Use your phone camera instead
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    if (left <= 0) setMessage("Your disposable camera is full.");
                    else {
                      setLeft((n) => n - 1);
                      Array.from(e.target.files ?? []).forEach((f) => enqueue(f, f.name, "capture"));
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        ) : (
          <label className={s.primary} style={{ cursor: "pointer" }}>
            CHOOSE PHOTOS
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {message && (
          <p className={s.error} role="alert">
            {message}
          </p>
        )}

        <div className={s.stack}>
          <div className={s.row}>
            <span className={s.rowValue} style={{ maxWidth: "none" }}>
              {totalPhotos + 0} photo count
            </span>
          </div>
          <div className={s.row}>
            <span>{uploading} uploading</span>
            <span className={s.rowValue}>Private before reveal</span>
          </div>
          <div className={s.row}>
            <span>Complete roll opens after the event</span>
            <span className={s.rowValue}>{revealed ? "REVEALED-AFTER-EVENT" : "LOCKED-BEFORE-REVEAL"}</span>
          </div>
        </div>

        {failed.map((j) => (
          <div key={j.key} className={s.row} role="alert">
            <span>{j.error ?? "Upload failed"}</span>
            <button type="button" className={s.segBtn} style={{ flex: "0 0 auto", minHeight: 32 }} onClick={() => retry(j)}>
              RETRY
            </button>
          </div>
        ))}

        <div className={s.state}>
          <p className={s.stateLabel}>CAPTURE STATE</p>
          <p className={s.stateText}>Private before reveal → revealed after event.</p>
        </div>
      </section>

      {mine.length > 0 && (
        <section className={s.card} aria-label="Your private roll">
          <div className={s.head}>
            <h2 className={s.title} style={{ fontSize: 18 }}>Your private roll</h2>
            <p className={s.body}>Only you can see these until the roll opens.</p>
          </div>
          <div className={s.grid}>
            {mine.map((m) => (
              <div key={m.id} className={s.thumb}>
                {m.kind === "video" ? (
                  <video src={`/api/media/${m.id}`} muted preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${m.id}`} alt="Your photo" loading="lazy" />
                )}
                {!revealed && (
                  <button type="button" className={s.delete} onClick={() => remove(m.id)} aria-label="Delete this item">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={s.pills}>
        {[
          { label: "CAPTURE", on: tab === "capture" },
          { label: "UPLOAD", on: tab === "upload" },
          { label: "LOCKED-BEFORE-REVEAL", on: !revealed },
          { label: "REVEALED-AFTER-EVENT", on: revealed },
        ].map((p) => (
          <span key={p.label} className={`${s.pill} ${p.on ? s.pillOn : ""}`}>
            {p.label}
          </span>
        ))}
      </div>
    </>
  );
}
