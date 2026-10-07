"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

type Choice = "accept" | "decline";

export default function RsvpCard() {
  const [choice, setChoice] = useState<Choice>("accept");
  const [name, setName] = useState("");
  const [companion, setCompanion] = useState("");
  const [dietary, setDietary] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Choice | null>(null);
  const [error, setError] = useState("");
  const [already, setAlready] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, attendance: choice, companion, dietary }),
      });
      if (res.status === 409) setAlready(true);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setDone(choice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className={`${styles.rsvpCard} ${styles.thanks}`} role="status">
        <p className={styles.thanksTitle}>
          {done === "accept" ? "You are on the list." : "Response received."}
        </p>
        <p className={styles.body}>
          {done === "accept"
            ? "Your pass is confirmed. Dietary and access details stay private to the host. See you at midnight."
            : "Thank you for letting us know. You will be missed."}
        </p>
        <p className={styles.body}>
          <Link href="/experience">Open the event experience →</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.rsvpCard} onSubmit={submit}>
      <div className={styles.options} role="group" aria-label="Attendance">
        <button
          type="button"
          aria-pressed={choice === "accept"}
          className={`${styles.option} ${choice === "accept" ? styles.optionOn : ""}`}
          onClick={() => setChoice("accept")}
        >
          <span className={styles.showDesktop}>JOYFULLY ACCEPT</span>
          <span className={styles.showMobile}>ACCEPT</span>
        </button>
        <button
          type="button"
          aria-pressed={choice === "decline"}
          className={`${styles.option} ${choice === "decline" ? styles.optionOn : ""}`}
          onClick={() => setChoice("decline")}
        >
          DECLINE
        </button>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Guest name</span>
        <input
          className={styles.fieldInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
          maxLength={120}
          autoComplete="name"
        />
      </label>
      {choice === "accept" && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Companion</span>
          <input
            className={styles.fieldInput}
            value={companion}
            onChange={(e) => setCompanion(e.target.value)}
            placeholder="Add companion ＋"
            maxLength={120}
          />
        </label>
      )}
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Dietary / access</span>
        <input
          className={styles.fieldInput}
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          placeholder="Edit privately"
          maxLength={500}
        />
      </label>

      <button type="submit" className={styles.action} disabled={sending}>
        {sending ? "Sending…" : "Confirm response"}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/arrow-right.svg" alt="" width={14} height={14} />
      </button>
      <p className={styles.status} role="alert">
        {error}
        {already && (
          <>
            {" "}
            <Link href="/respond" style={{ textDecoration: "underline" }}>
              Update your response
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
