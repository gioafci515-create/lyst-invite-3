"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";
import { mmss, pickMime, postMedia } from "../upload";

type Phase = "idle" | "starting" | "recording" | "preview" | "sending" | "done";
const MAX_SECONDS = 60;

export default function VideoRecorder({ total, mine }: { total: number; mine: number }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [source, setSource] = useState<"capture" | "upload">("capture");

  const live = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const startedAt = useRef(0);

  const release = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => release, [release]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  useEffect(() => {
    if (phase === "recording" && live.current && stream.current) {
      live.current.srcObject = stream.current;
      void live.current.play().catch(() => {});
    }
  }, [phase]);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => {
      const t = (Date.now() - startedAt.current) / 1000;
      setElapsed(Math.min(t, MAX_SECONDS));
      if (t >= MAX_SECONDS) stop();
    }, 200);
    return () => clearInterval(id);
  }, [phase, stop]);

  async function record() {
    setError("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording is not supported in this browser. Upload an existing clip instead.");
      return;
    }
    setPhase("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      stream.current = media;
      const mime = pickMime([
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ]);
      const rec = new MediaRecorder(media, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunks.current, { type: rec.mimeType || "video/webm" });
        blob.current = b;
        setUrl(URL.createObjectURL(b));
        setSource("capture");
        setElapsed(Math.min((Date.now() - startedAt.current) / 1000, MAX_SECONDS));
        setPhase("preview");
        release();
      };
      recorder.current = rec;
      setPhase("recording");
      startedAt.current = Date.now();
      setElapsed(0);
      rec.start(500);
    } catch {
      release();
      setPhase("idle");
      setError("Camera or microphone blocked. Allow access in your browser, or upload an existing clip.");
    }
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    setError("");
    const probe = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const d = probe.duration;
      if (Number.isFinite(d) && d > MAX_SECONDS + 1) {
        URL.revokeObjectURL(objectUrl);
        setError(`Clips can be up to ${MAX_SECONDS} seconds.`);
        return;
      }
      blob.current = file;
      setUrl(objectUrl);
      setElapsed(Number.isFinite(d) ? d : 0);
      setSource("upload");
      setPhase("preview");
    };
    probe.onerror = () => {
      blob.current = file;
      setUrl(objectUrl);
      setSource("upload");
      setPhase("preview");
    };
    probe.src = objectUrl;
  }

  function again() {
    blob.current = null;
    setUrl(null);
    setElapsed(0);
    setError("");
    setPhase("idle");
  }

  async function submit() {
    if (!blob.current) return;
    setPhase("sending");
    setError("");
    try {
      const type = blob.current.type.split(";")[0];
      const ext = type.includes("mp4") ? "mp4" : type.includes("quicktime") ? "mov" : "webm";
      await postMedia(blob.current, {
        context: "video",
        source,
        filename: `message.${ext}`,
        seconds: elapsed,
      });
      setPhase("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("preview");
    }
  }

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>A message they can return to.</h1>
          <p className={s.body}>
            Record up to 60 seconds or upload existing. Preview, re-record, submit, and
            confirmation.
          </p>
        </div>

        {phase === "recording" && (
          <div className={s.preview}>
            <video ref={live} muted playsInline aria-label="Camera preview" />
            <span className={s.badge} style={{ left: 8, right: "auto", top: 8, bottom: "auto" }}>
              ● REC {mmss(elapsed)} / {mmss(MAX_SECONDS)}
            </span>
          </div>
        )}

        {(phase === "preview" || phase === "sending") && url && (
          <div className={s.preview}>
            <video src={url} controls playsInline aria-label="Preview of your clip" />
          </div>
        )}

        <div className={s.stack}>
          {phase === "idle" || phase === "starting" ? (
            <>
              <button type="button" className={s.primary} onClick={record} disabled={phase === "starting"}>
                {phase === "starting" ? "Starting camera…" : "RECORD"}
              </button>
              <label className={s.ghost} style={{ cursor: "pointer", width: "100%" }}>
                UPLOAD EXISTING
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </>
          ) : null}

          {phase === "recording" && (
            <button type="button" className={s.primary} onClick={stop}>
              STOP
            </button>
          )}

          {(phase === "preview" || phase === "sending") && (
            <>
              <div className={s.row}>
                <span>Preview {mmss(elapsed)}</span>
                <button
                  type="button"
                  className={s.rowValue}
                  style={{ background: "none", border: 0, font: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  onClick={again}
                  disabled={phase === "sending"}
                >
                  RE-RECORD
                </button>
              </div>
              <button type="button" className={s.primary} onClick={submit} disabled={phase === "sending"}>
                {phase === "sending" ? "Submitting…" : "ADD TO MONTAGE"}
              </button>
            </>
          )}
        </div>

        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}

        <div className={s.stack}>
          <div className={s.row}>
            <span>Submit confirmation</span>
            <span className={s.rowValue}>{phase === "done" ? "✓ CONFIRMATION" : "PENDING"}</span>
          </div>
          <div className={s.row}>
            <span>Your clip joins a future memory montage</span>
            <span className={s.rowValue}>MONTAGE</span>
          </div>
        </div>

        <div className={s.state}>
          <p className={s.stateLabel}>VIDEO STATE</p>
          <p className={s.stateText}>
            {phase === "done" ? (
              <>
                Confirmed. Your clip is saved privately and will appear in the montage.{" "}
                <button type="button" onClick={again} style={{ textDecoration: "underline", background: "none", border: 0, font: "inherit", cursor: "pointer" }}>
                  Add another
                </button>
              </>
            ) : (
              "Record, upload, preview, re-record, submit, confirmation, and montage."
            )}
          </p>
        </div>

        <div className={s.row}>
          <span>{total} clips so far</span>
          <span className={s.rowValue}>{mine} YOURS</span>
        </div>
      </section>

      <div className={s.pills}>
        {[
          { label: "RECORD", on: phase === "idle" || phase === "starting" || phase === "recording" },
          { label: "UPLOAD", on: phase === "preview" && source === "upload" },
          { label: "PREVIEW", on: phase === "preview" || phase === "sending" },
          { label: "RE-RECORD", on: phase === "preview" },
          { label: "ADD TO MONTAGE", on: phase === "preview" || phase === "sending" },
          { label: "CONFIRMATION", on: phase === "done", check: true },
          { label: "MONTAGE", on: phase === "done" },
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
