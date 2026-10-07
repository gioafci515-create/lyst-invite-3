"use client";

import { useState } from "react";
import s from "../ui.module.css";
import { useReadIds } from "../read-state";

type Kind = "location" | "host" | "rsvp" | "activity" | "schedule" | "capsule";
type Notice = {
  id: string;
  kind: Kind;
  title: string;
  detail: string;
  priority: boolean;
  createdAt: string;
};

const LABEL: Record<Kind, string> = {
  location: "Location change",
  host: "Host announcement",
  rsvp: "RSVP reminder",
  activity: "Activity",
  schedule: "Schedule change",
  capsule: "Capsule unlock",
};

type Filter = "unread" | "priority" | "reminder" | "activity" | "capsule" | "host";

const FILTERS: { key: Filter; label: string; test: (n: Notice, read: Set<string>) => boolean }[] = [
  { key: "unread", label: "READ / UNREAD", test: (n, r) => !r.has(n.id) },
  { key: "priority", label: "PRIORITY", test: (n) => n.priority },
  { key: "reminder", label: "REMINDER", test: (n) => n.kind === "rsvp" || n.kind === "schedule" },
  { key: "activity", label: "ACTIVITY", test: (n) => n.kind === "activity" },
  { key: "capsule", label: "CAPSULE", test: (n) => n.kind === "capsule" },
  { key: "host", label: "HOST", test: (n) => n.kind === "host" || n.kind === "location" },
];

function ago(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "now";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NotificationList({ notices }: { notices: Notice[] }) {
  const { read, markRead } = useReadIds();
  const [active, setActive] = useState<Set<Filter>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const unread = notices.filter((n) => !read.has(n.id));
  const priorityUnread = unread.filter((n) => n.priority).length;

  const visible = notices
    .filter((n) => [...active].every((f) => FILTERS.find((x) => x.key === f)!.test(n, read)))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || b.createdAt.localeCompare(a.createdAt));

  const toggle = (f: Filter) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  return (
    <>
      <section className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>
            {unread.length} unread{priorityUnread > 0 ? " · priority" : ""}
          </h1>
          <p className={s.body}>
            Location change, host announcement, RSVP reminder, activity, schedule change, and
            capsule unlock.
          </p>
        </div>

        <div className={s.stack}>
          {visible.length === 0 && (
            <div className={s.row}>
              <span>Nothing here</span>
              <span className={s.rowValue}>{active.size ? "CLEAR FILTERS" : "ALL CAUGHT UP"}</span>
            </div>
          )}
          {visible.map((n) => {
            const isRead = read.has(n.id);
            const open = openId === n.id;
            return (
              <div key={n.id} className={s.stack} style={{ gap: 6 }}>
                <button
                  type="button"
                  className={`${s.row} ${open ? s.rowOpen : ""}`}
                  aria-expanded={open}
                  onClick={() => {
                    setOpenId(open ? null : n.id);
                    markRead([n.id]);
                  }}
                >
                  <span className={s.rowLabel} style={{ fontWeight: isRead ? 400 : 700, color: isRead ? "#6e6e6d" : "#17171c" }}>
                    {!isRead && <span aria-label="Unread">● </span>}
                    {LABEL[n.kind]}
                  </span>
                  <span className={s.rowValue}>{n.priority ? "PRIORITY" : ago(n.createdAt)}</span>
                </button>
                {open && (
                  <div className={s.panel}>
                    <strong>{n.title}</strong>
                    <p className={s.body}>{n.detail}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={s.primary}
          disabled={unread.length === 0}
          onClick={() => markRead(notices.map((n) => n.id))}
        >
          MARK ALL READ
        </button>

        <div className={s.state}>
          <p className={s.stateLabel}>NOTIFICATIONS STATE</p>
          <p className={s.stateText}>Read / unread, priority, reminder, activity, capsule, and host.</p>
        </div>
      </section>

      <div className={s.pills} role="group" aria-label="Filter notifications">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={active.has(f.key)}
            className={`${s.pill} ${active.has(f.key) ? s.pillOn : ""}`}
            onClick={() => toggle(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </>
  );
}
