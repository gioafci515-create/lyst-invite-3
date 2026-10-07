import Link from "next/link";
import type { ReactNode } from "react";
import s from "./ui.module.css";

export function Content({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "violet";
}) {
  return (
    <div className={`${s.content} ${tone === "violet" ? s.violet : ""}`}>
      {children}
    </div>
  );
}

export function Card({
  title,
  body,
  children,
}: {
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={s.card}>
      <div className={s.head}>
        <h1 className={s.title}>{title}</h1>
        {body && <p className={s.body}>{body}</p>}
      </div>
      {children}
    </section>
  );
}

export function Row({
  label,
  value,
  href,
}: {
  label: ReactNode;
  value?: ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <span className={s.rowLabel}>{label}</span>
      {value !== undefined && <span className={s.rowValue}>{value}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={s.row}>
      {inner}
    </Link>
  ) : (
    <div className={s.row}>{inner}</div>
  );
}

export function StateBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.state}>
      <p className={s.stateLabel}>{label}</p>
      <p className={s.stateText}>{children}</p>
    </div>
  );
}

export type PillSpec = { label: string; on?: boolean; check?: boolean };

export function Pills({ items }: { items: PillSpec[] }) {
  return (
    <div className={s.pills}>
      {items.map((p) => (
        <span key={p.label} className={`${s.pill} ${p.on ? s.pillOn : ""}`}>
          {p.check && p.on && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/check.svg" alt="" width={16} height={16} />
          )}
          {p.label}
        </span>
      ))}
    </div>
  );
}

const STEPS = [
  { label: "INVITE", href: "/" },
  { label: "RESPOND", href: "/respond" },
  { label: "PREPARE", href: "/experience" },
  { label: "PARTICIPATE", href: "/interact" },
  { label: "REMEMBER", href: "/gallery" },
] as const;

export function Journey({
  action,
  here,
  tone,
}: {
  action: string;
  here?: (typeof STEPS)[number]["label"];
  tone?: "violet";
}) {
  return (
    <nav
      className={`${s.journey} ${tone === "violet" ? s.journeyOnViolet : ""}`}
      aria-label="Event journey"
    >
      <span>{action}</span>
      <span aria-hidden="true">·</span>
      {STEPS.map((step, i) => (
        <span key={step.label}>
          <Link
            href={step.href}
            className={here === step.label ? s.journeyHere : undefined}
            aria-current={here === step.label ? "step" : undefined}
          >
            {step.label}
          </Link>
          {i < STEPS.length - 1 && <span aria-hidden="true"> →</span>}
        </span>
      ))}
    </nav>
  );
}

export function Loading() {
  return <div className={s.skeleton} aria-busy="true" aria-label="Loading" />;
}
