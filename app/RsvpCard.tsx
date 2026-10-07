"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Choice = "accept" | "decline";

export default function RsvpCard() {
  const [choice, setChoice] = useState<Choice>("accept");
  const [confirmed, setConfirmed] = useState(false);

  const pick = (c: Choice) => {
    setChoice(c);
    setConfirmed(false);
  };

  return (
    <div className={styles.rsvpCard}>
      <div className={styles.options} role="group" aria-label="Attendance">
        <button
          type="button"
          aria-pressed={choice === "accept"}
          className={`${styles.option} ${choice === "accept" ? styles.optionOn : ""}`}
          onClick={() => pick("accept")}
        >
          <span className={styles.showDesktop}>JOYFULLY ACCEPT</span>
          <span className={styles.showMobile}>ACCEPT</span>
        </button>
        <button
          type="button"
          aria-pressed={choice === "decline"}
          className={`${styles.option} ${choice === "decline" ? styles.optionOn : ""}`}
          onClick={() => pick("decline")}
        >
          DECLINE
        </button>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Guest name</span>
        <span>Add companion ＋</span>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Dietary / access</span>
        <span>Edit privately</span>
      </div>

      <button
        type="button"
        className={styles.action}
        onClick={() => setConfirmed(true)}
      >
        {confirmed
          ? choice === "accept"
            ? "Confirmed — see you at midnight"
            : "Response sent — you will be missed"
          : "Confirm response"}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/arrow-right.svg" alt="" width={14} height={14} />
      </button>
      <p className={styles.status} role="status" aria-live="polite">
        {confirmed ? "Your response has been recorded privately." : ""}
      </p>
    </div>
  );
}
