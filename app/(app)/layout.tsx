import Link from "next/link";
import type { Metadata } from "next";
import s from "./ui.module.css";

export const metadata: Metadata = {
  title: "NOCTURNE 11 — Event Experience",
  description: "Respond, capture, participate and remember — the NOCTURNE 11 guest experience.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.appBar}>
        <Link href="/experience" aria-label="Event home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/check-circle.svg" alt="" width={20} height={20} />
        </Link>
      </header>
      <main className={s.main}>{children}</main>
    </div>
  );
}
