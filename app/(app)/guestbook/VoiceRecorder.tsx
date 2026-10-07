"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";
import { mmss, pickMime, postMedia } from "../upload";

type Phase = "idle" | "recording" | "paused" | "stopped" | "sending" | "done";
const MAX_SECONDS = 180;

export default function VoiceRecorder({ total, mine }: { total: number; mine: string[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const clock = useRef({ started: 0, banked: 0 });

  const cleanup = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close();
    audioCtx.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  // timer
  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => {
      const t = clock.current.banked + (Date.now() - clock.current.started) / 1000;
      setElapsed(t);
      if (t >= MAX_SECONDS) stop();
    }, 200);
    return () => clearInterval(id);
     
  }, [phase]);

  function draw(analyser: AnalyserNode) {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, el.width, el.height);
      const bars = 24;
      const w = el.width / bars;
      ctx.fillStyle = "#b9ff34";
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.6)] / 255;
        const h = Math.max(4, v * el.height);
        ctx.fillRect(i * w + 2, (el.height - h) / 2, w - 4, h);
      }
      raf.current = requestAnimationFrame(loop);
    };
    loop();
  }

  async function record() {
    setError("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mime = pickMime(["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]);
      const rec = new MediaRecorder(media, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        blob.current = b;
        setUrl(URL.createObjectURL(b));
        setPhase("stopped");
        cleanup();
      };
      rec.start(250);
      recorder.current = rec;

      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      ctx.createMediaStreamSource(media).connect(analyser);
      draw(analyser);

      clock.current = { started: Date.now(), banked: 0 };
      setElapsed(0);
      setPhase("recording");
    } catch {
      setError("Microphone blocked. Allow microphone access in your browser, or upload a recording below.");
      setUnsupported(true);
    }
  }

  function pause() {
    if (recorder.current?.state !== "recording") return;
    recorder.current.pause();
    clock.current.banked += (Date.now() - clock.current.started) / 1000;
    setPhase("paused");
  }

  function resume() {
    if (recorder.current?.state !== "paused") return;
    recorder.current.resume();
    clock.current.started = Date.now();
    setPhase("recording");
  }

  function stop() {
    if (recorder.current && recorder.current.state !== "inactive") {
      if (clock.current.started && recorder.current.state === "recording") {
        clock.current.banked += (Date.now() - clock.current.started) / 1000;
        setElapsed(clock.current.banked);
      }
      recorder.current.stop();
    }
  }

  function playback() {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  }

  function again() {
    audio.current?.pause();
    setPlaying(false);
    blob.current = null;
    setUrl(null);
    setElapsed(0);
    setError("");
    setPhase("idle");
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    blob.current = file;
    setUrl(URL.createObjectURL(file));
    setPhase("stopped");
  }

  async function submit() {
    if (!blob.current) return;
    setPhase("sending");
    setError("");
    try {
      const type = blob.current.type.split(";")[0] || "audio/webm";
      const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "weba";
      await postMedia(blob.current, {
        context: "guestbook",
        source: "capture",
        filename: `memory.${ext}`,
        seconds: elapsed,
      });
      setPhase("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("stopped");
    }
  }

  const active = phase === "recording" || phase === "paused";
  const title =
    phase === "recording" || phase === "paused"
      ? `Recording · active timer ${mmss(elapsed)}`
      : phase === "stopped" || phase === "sending"
        ? `Recorded · ${mmss(elapsed)}`
        : phase === "done"
          ? "Memory submitted."
          : "Leave a voice memory.";

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>{title}</h1>
          <p className={s.body}>
            Waveform, pause, stop, playback, and submit for the future montage.
          </p>
        </div>

        {phase !== "done" && (
          <div className={s.stack} style={{ alignItems: "center" }}>
            {active ? (
              <canvas ref={canvas} width={300} height={56} className={s.wave} aria-label="Live waveform" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/images/waveform.svg" alt="" width={90} height={27} />
            )}

            <div className={s.seg} style={{ width: "100%" }}>
              {phase === "paused" ? (
                <button type="button" className={`${s.segBtn} ${s.segOn}`} onClick={resume}>
                  RESUME
                </button>
              ) : (
                <button
                  type="button"
                  className={`${s.segBtn} ${phase === "idle" || phase === "recording" ? s.segOn : ""}`}
                  onClick={record}
                  disabled={phase !== "idle"}
                >
                  RECORD
                </button>
              )}
              <button type="button" className={s.segBtn} onClick={pause} disabled={phase !== "recording"}>
                PAUSE
              </button>
              <button type="button" className={s.segBtn} onClick={stop} disabled={!active}>
                STOP
              </button>
            </div>
            <div className={s.seg} style={{ width: "100%" }}>
              <button
                type="button"
                className={s.segBtn}
                onClick={playback}
                disabled={phase !== "stopped"}
              >
                {playing ? "PAUSE PLAYBACK" : "PLAYBACK"}
              </button>
              <button type="button" className={s.segBtn} onClick={again} disabled={phase !== "stopped"}>
                RE-RECORD
              </button>
            </div>

            {unsupported && phase === "idle" && (
              <label className={s.ghost} style={{ cursor: "pointer", width: "100%" }}>
                Upload an audio file instead
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}

            {url && (
              <audio
                ref={audio}
                src={url}
                onEnded={() => setPlaying(false)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d) && !elapsed) setElapsed(d);
                }}
                hidden
              />
            )}

            {phase === "stopped" || phase === "sending" ? (
              <button type="button" className={s.primary} onClick={submit} disabled={phase === "sending"}>
                {phase === "sending" ? "Submitting…" : "SUBMIT MEMORY"}
              </button>
            ) : null}
          </div>
        )}

        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}

        <div className={s.state}>
          <p className={s.stateLabel}>{phase === "done" ? "SUCCESS" : "RECORDING STATE"}</p>
          <p className={s.stateText}>
            {phase === "done" ? (
              <>
                Your voice is saved privately and joins the future montage.{" "}
                <button type="button" onClick={again} style={{ textDecoration: "underline", background: "none", border: 0, font: "inherit", cursor: "pointer" }}>
                  Record another
                </button>
              </>
            ) : (
              "Listen, re-record, submit, and join the future montage."
            )}
          </p>
        </div>

        <div className={s.row}>
          <span>{total} voice memories so far</span>
          <span className={s.rowValue}>{mine.length} YOURS</span>
        </div>
      </section>

      <div className={s.pills}>
        {[
          { label: "RECORD", on: phase === "idle" || phase === "recording" },
          { label: "TIMER", on: active },
          { label: "WAVEFORM / PLAYBACK", on: phase === "stopped" || playing },
          { label: "RE-RECORD", on: phase === "stopped" },
          { label: "SUBMIT MEMORY", on: phase === "stopped" || phase === "sending" },
          { label: "SUCCESS", on: phase === "done", check: true },
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
