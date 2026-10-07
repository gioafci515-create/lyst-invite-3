import Link from "next/link";
import { logout } from "./actions";
import styles from "./admin.module.css";

const TABS = [
  { href: "/admin", label: "Responses", key: "responses" },
  { href: "/admin/content", label: "Live content", key: "content" },
  { href: "/admin/submissions", label: "Submissions", key: "submissions" },
] as const;

export default function AdminNav({
  current,
  title,
  extra,
}: {
  current: (typeof TABS)[number]["key"];
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>LYST / 07 · Admin</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <div className={styles.headerActions}>
          {extra}
          <form action={logout}>
            <button type="submit" className={styles.secondary}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <nav className={styles.tabs} aria-label="Admin sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`${styles.tab} ${t.key === current ? styles.tabOn : ""}`}
            aria-current={t.key === current ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
