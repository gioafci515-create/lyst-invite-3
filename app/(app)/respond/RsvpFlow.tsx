"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../ui.module.css";

export type RsvpValues = {
  name: string;
  attendance: "accept" | "decline";
  guests: number;
  companion: string;
  meal: string;
  dietary: string;
  request: string;
};

const MEALS = ["Garden menu", "Night menu", "Vegan menu", "No meal"];
const DIETARY = ["None", "Nut allergy", "Gluten-free", "Lactose-free", "Vegetarian", "Other"];
const DEADLINE = "24 DEC · 18:00";

const EMPTY: RsvpValues = {
  name: "",
  attendance: "accept",
  guests: 2,
  companion: "",
  meal: MEALS[0],
  dietary: DIETARY[0],
  request: "",
};

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={s.field}>
      <label className={s.fieldLabel} htmlFor={id}>
        {label}
      </label>
      <div className={s.selectWrap}>
        <select
          id={id}
          className={s.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/chevron-down.svg" alt="" width={16} height={16} />
      </div>
    </div>
  );
}

function pillsFor(v: RsvpValues, editing: boolean, saved: boolean) {
  return [
    { label: "YES SELECTED", on: v.attendance === "accept" },
    { label: "NO AVAILABLE", on: v.attendance === "decline" },
    { label: "EDITING", on: editing },
    { label: "CONFIRMATION", on: saved, check: true },
  ];
}

export default function RsvpFlow({
  existing,
  closed,
}: {
  existing: RsvpValues | null;
  closed: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<RsvpValues>(existing ?? EMPTY);
  const [hasResponse, setHasResponse] = useState(Boolean(existing));
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof RsvpValues>(k: K, v: RsvpValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const dietaryOther = !DIETARY.includes(values.dietary) && values.dietary !== "";
  const dietarySelect = dietaryOther ? "Other" : values.dietary || "None";
  const nameMissing = touched && !values.name.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!values.name.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: hasResponse ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          dietary: values.dietary === "None" ? "" : values.dietary,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setHasResponse(true);
      setEditing(false);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  /* ---------- summary (already submitted / closed) ---------- */
  if (hasResponse && !editing) {
    const yes = values.attendance === "accept";
    return (
      <>
        <section className={s.card}>
          <div className={s.head}>
            <h1 className={s.title}>
              {closed ? "RSVP closed." : yes ? "You are on the list." : "Response received."}
            </h1>
            <p className={s.body}>
              {closed
                ? "Responses closed on 24 December. Contact the host for changes."
                : "Already submitted — you can update your response until the deadline."}
            </p>
          </div>
          <div className={s.stack}>
            <div className={s.row}>
              <span>Response</span>
              <span className={s.rowValue}>{yes ? "YES" : "NO"}</span>
            </div>
            <div className={s.row}>
              <span>Name</span>
              <span className={s.rowValue}>{values.name}</span>
            </div>
            {yes && (
              <>
                <div className={s.row}>
                  <span>Guest count</span>
                  <span className={s.rowValue}>{values.guests === 1 ? "1 guest" : `${values.guests} guests`}</span>
                </div>
                {values.companion && (
                  <div className={s.row}>
                    <span>Companion</span>
                    <span className={s.rowValue}>{values.companion}</span>
                  </div>
                )}
                <div className={s.row}>
                  <span>Meal preference</span>
                  <span className={s.rowValue}>{values.meal}</span>
                </div>
              </>
            )}
            {values.dietary && values.dietary !== "None" && (
              <div className={s.row}>
                <span>Dietary restriction</span>
                <span className={s.rowValue}>{values.dietary}</span>
              </div>
            )}
            {values.request && (
              <div className={s.row}>
                <span>Special request</span>
                <span className={s.rowValue}>{values.request}</span>
              </div>
            )}
            <div className={s.row}>
              <span>Deadline</span>
              <span className={s.rowValue}>{closed ? "RSVP CLOSED" : DEADLINE}</span>
            </div>
          </div>
          <div className={s.state}>
            <p className={s.stateLabel}>CONFIRMATION</p>
            <p className={s.stateText}>
              {yes
                ? `${values.guests === 1 ? "One seat" : "Two seats"} saved. `
                : "Your decline is saved. "}
              {yes && (
                <>
                  <a href="/api/calendar">Add to calendar</a> ·{" "}
                  <a
                    href="https://maps.google.com/?q=Substation+K+Berlin"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions
                  </a>
                </>
              )}
            </p>
          </div>
          {!closed && (
            <button
              type="button"
              className={s.primary}
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              UPDATE RESPONSE
            </button>
          )}
        </section>
        <div className={s.pills}>
          {pillsFor(values, false, true).map((p) => (
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

  /* ---------- closed, no response ---------- */
  if (closed) {
    return (
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>RSVP closed.</h1>
          <p className={s.body}>
            Responses closed on 24 December at 18:00. Please contact the host if you still
            hope to join.
          </p>
        </div>
        <div className={s.row}>
          <span>Closed</span>
          <span className={s.rowValue}>RSVP CLOSED</span>
        </div>
      </section>
    );
  }

  /* ---------- form ---------- */
  const yes = values.attendance === "accept";
  return (
    <>
      <form className={s.card} onSubmit={submit} noValidate>
        <div className={s.head}>
          <h1 className={s.title}>Will you be there?</h1>
          <p className={s.body}>
            Two seats are reserved for your response. Guest count, meal preference, and arrival
            notes are saved with your confirmation.
          </p>
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor="name">
            YOUR NAME
          </label>
          <input
            id="name"
            className={`${s.input} ${nameMissing ? s.invalid : ""}`}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            maxLength={120}
            aria-invalid={nameMissing}
            aria-describedby={nameMissing ? "name-error" : undefined}
          />
          {nameMissing && (
            <p className={s.error} id="name-error" role="alert">
              REQUIRED FIELD
            </p>
          )}
        </div>

        <div className={s.seg} role="group" aria-label="Will you attend">
          <button
            type="button"
            aria-pressed={yes}
            className={`${s.segBtn} ${yes ? s.segOn : ""}`}
            onClick={() => set("attendance", "accept")}
          >
            YES
          </button>
          <button
            type="button"
            aria-pressed={!yes}
            className={`${s.segBtn} ${!yes ? s.segOn : ""}`}
            onClick={() => set("attendance", "decline")}
          >
            NO
          </button>
        </div>

        {yes && (
          <div className={s.stack}>
            <Select
              id="guests"
              label="GUEST COUNT"
              value={values.guests === 1 ? "1 guest" : "2 guests"}
              options={["1 guest", "2 guests"]}
              onChange={(v) => set("guests", v.startsWith("1") ? 1 : 2)}
            />
            {values.guests === 2 && (
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="companion">
                  PLUS-ONE NAME
                </label>
                <input
                  id="companion"
                  className={s.input}
                  value={values.companion}
                  onChange={(e) => set("companion", e.target.value)}
                  placeholder="Add guest"
                  maxLength={120}
                />
              </div>
            )}
            <Select
              id="meal"
              label="MEAL PREFERENCE"
              value={values.meal}
              options={MEALS}
              onChange={(v) => set("meal", v)}
            />
          </div>
        )}

        <div className={s.stack}>
          <Select
            id="dietary"
            label="DIETARY RESTRICTION"
            value={dietarySelect}
            options={DIETARY}
            onChange={(v) => set("dietary", v === "Other" ? " " : v)}
          />
          {dietarySelect === "Other" && (
            <input
              className={s.input}
              aria-label="Describe your dietary restriction"
              value={values.dietary.trim() === "" ? "" : values.dietary}
              onChange={(e) => set("dietary", e.target.value || " ")}
              placeholder="Describe privately"
              maxLength={200}
            />
          )}
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor="request">
            SPECIAL REQUEST
          </label>
          <textarea
            id="request"
            className={s.textarea}
            value={values.request}
            onChange={(e) => set("request", e.target.value)}
            placeholder="Step-free arrival requested for the guest."
            maxLength={500}
          />
        </div>

        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={s.primary} disabled={sending}>
          {sending ? "Saving…" : editing ? "UPDATE RESPONSE" : "CONFIRM RESPONSE"}
        </button>
        {editing && (
          <button type="button" className={s.ghost} onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
      </form>
      <div className={s.pills}>
        {pillsFor(values, editing, saved).map((p) => (
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

export { EMPTY as RSVP_DEFAULTS };
