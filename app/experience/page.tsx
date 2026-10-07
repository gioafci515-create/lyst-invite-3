import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import {
  contributionCounts,
  getRsvpByGuest,
  listAnnouncements,
  listNotices,
} from "@/lib/store";
import {
  EVENT,
  SCHEDULE,
  clock,
  longDate,
  nextMoment,
  percentThrough,
  phase,
} from "@/lib/event";
import Alerts from "./Alerts";
import s from "./experience.module.css";

export const metadata: Metadata = {
  title: "NOCTURNE 11 — Live Event Experience",
  description: "Schedule, location, guest information and everything you can do at NOCTURNE 11.",
};

export default function ExperiencePage() {
  return (
    <div className={s.page}>
      <Suspense fallback={<div className={s.loading} aria-busy="true" />}>
        <ExperienceContent />
      </Suspense>
    </div>
  );
}

const ACTIONS = [
  { href: "/respond", label: "RSVP", note: "Respond · edit before 24 Dec" },
  { href: "/camera", label: "Camera", note: "Disposable mode + upload" },
  { href: "/guestbook", label: "Voice guestbook", note: "Leave a voice memory" },
  { href: "/videos", label: "Video messages", note: "Up to 60 seconds" },
  { href: "/later", label: "Message for later", note: "Sealed until 2027" },
  { href: "/interact", label: "Live room", note: "Letters, challenges, polls" },
  { href: "/gallery", label: "Gallery", note: "The room, together" },
  { href: "/capsule", label: "Time capsule", note: "Opens 31 Dec 2027" },
  { href: "/montage", label: "Montage", note: "Watch the night" },
  { href: "/notifications", label: "Updates", note: "Host + schedule alerts" },
  { href: "/states", label: "All states", note: "Live status board" },
];

async function ExperienceContent() {
  await connection();
  const now = new Date();
  const guestId = await getGuestId();
  const [rsvp, announcements, notices, counts] = await Promise.all([
    guestId ? getRsvpByGuest(guestId) : null,
    listAnnouncements(),
    listNotices(),
    contributionCounts(),
  ]);

  const p = phase(now);
  const next = nextMoment(now);
  const announcement = announcements.find((a) => a.active)?.text;
  const headline =
    p === "live" ? "● LIVE EXPERIENCE" : p === "before" ? "● COMING UP" : "● THE NIGHT, REMEMBERED";
  const moment =
    announcement ??
    (p === "live" && next
      ? `The next moment begins in ${next.minutes} minutes.`
      : p === "before"
        ? "Doors open at 22:00 on 31 December."
        : "Thank you for being in the room.");

  const respondState = rsvp ? (rsvp.attendance === "accept" ? "CONFIRMED" : "DECLINED") : "PENDING";
  const journey = [
    { label: `INVITE · OPENED`, href: "/" },
    { label: `RESPOND · ${respondState}`, href: "/respond" },
    { label: `PREPARE · ${rsvp ? "SAVED" : "OPEN"}`, href: "/experience" },
    { label: `PARTICIPATE · ${p === "live" ? "LIVE" : p === "before" ? "OPENS SOON" : "CLOSED"}`, href: "/interact" },
    { label: `REMEMBER · ${longDate(EVENT.capsuleUnlock)}`, href: "/capsule" },
  ];

  return (
    <>
      <header className={s.nav}>
        <Link href="/" className={s.mark}>
          LYST / 07
        </Link>
        <nav aria-label="Event sections" className={s.links}>
          <a href="#today">Today</a>
          <a href="#schedule">Schedule</a>
          <Link href="/interact">Participate</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/capsule">Capsule</Link>
          <Link href="/notifications">Updates</Link>
        </nav>
        <Link href="/notifications" className={s.live}>
          ● {p === "live" ? "LIVE" : p === "before" ? "SOON" : "ENDED"} ·{" "}
          <Alerts ids={notices.map((n) => n.id)} suffix=" ALERTS" /> · GUEST PASS
        </Link>
      </header>

      <section className={s.hero} id="today">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/halo-hub.svg" alt="" className={s.halo} />
        <div className={s.heroCopy}>
          <h1 className={s.display}>
            {headline}
            <br />
            {EVENT.name}
          </h1>
          <p className={s.small}>
            {EVENT.lineup} · {longDate(EVENT.start)}
          </p>
          <p className={s.small}>
            {EVENT.venue}, {EVENT.city}
          </p>
          <Link href="/interact" className={`${s.small} ${s.enter}`}>
            ENTER EVENT EXPERIENCE
          </Link>
        </div>
        <div className={s.media}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/live-media.png" alt="" className={s.mediaImg} />
          <p className={s.mediaLabel}>HOST ANNOUNCEMENT · {p === "live" ? "LIVE" : "NEXT"}</p>
          <p className={s.mediaText}>{moment}</p>
        </div>
      </section>

      <nav className={s.journey} aria-label="Event journey">
        {journey.map((j, i) => (
          <span key={j.label}>
            <Link href={j.href}>{j.label}</Link>
            {i < journey.length - 1 && <span aria-hidden="true"> &nbsp;→&nbsp; </span>}
          </span>
        ))}
      </nav>

      <section className={s.modules}>
        <div className={s.module} id="schedule">
          <h2 className={s.moduleTitle}>EVENT SCHEDULE</h2>
          <ul>
            {SCHEDULE.map((item) => (
              <li key={item.at}>
                {clock(item.at)} · {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div className={s.module}>
          <h2 className={s.moduleTitle}>LOCATION / INTEGRATED MAP</h2>
          <ul>
            <li>
              {EVENT.venue} · {EVENT.city}
            </li>
            <li>Directions · 24-hour U-Bahn service.</li>
            <li>Parking · No cars; taxi zone on Köpenicker.</li>
            <li>
              <a
                href="https://maps.google.com/?q=Substation+K+Berlin"
                target="_blank"
                rel="noreferrer"
                className={s.inline}
              >
                Open map ↗
              </a>
            </li>
          </ul>
        </div>
        <div className={s.module}>
          <h2 className={s.moduleTitle}>GUEST INFORMATION / FAQ</h2>
          <ul>
            <li>Dress · Midnight formal; reflective detail encouraged.</li>
            <li>Palette · Ultraviolet · black · bio lime</li>
            <li>Bring · Digital pass and cloakroom token.</li>
            <li>Stay · Michelberger · night code N11</li>
            <li>Host note · Quiet room in Chamber East.</li>
          </ul>
        </div>
      </section>

      <section className={s.ecosystem} aria-labelledby="eco">
        <p className={s.ecoEyebrow}>COMPLETE ECOSYSTEM EXTENSION</p>
        <h2 className={s.ecoTitle} id="eco">
          From invitation to memory, one living system.
        </h2>
        <p className={s.ecoBody}>
          The invitation&rsquo;s immersive dark luminous club experience becomes a native
          platform—not a reskinned dashboard.
        </p>
        <p className={s.ecoList}>
          01 / RESPOND — RSVP + confirmation
          <br />
          02 / CAPTURE — camera + voice + video
          <br />
          03 / PARTICIPATE — letters + challenges + polls
          <br />
          04 / REMEMBER — gallery + capsule + updates
        </p>
        <p className={s.ecoBody}>
          TODAY · {percentThrough(now)}% THROUGH THE EVENT
          <br />
          {announcement ? "Host announcement is live." : "No host announcement right now."}
          <br />
          {counts.photos} photos · {counts.voices} voice · {counts.videos} video · {counts.answers} answers ·{" "}
          <Alerts ids={notices.map((n) => n.id)} suffix=" unread" />
        </p>
        <p className={s.ecoStates}>
          DEFAULT · ACTIVE · RECORDING · SUBMITTED · LOCKED
          <br />
          REVEALED · UNREAD · PRIORITY · REMINDER
        </p>

        <ul className={s.actions}>
          {ACTIONS.map((a) => (
            <li key={a.href}>
              <Link href={a.href}>
                <strong>{a.label}</strong>
                <span>{a.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
