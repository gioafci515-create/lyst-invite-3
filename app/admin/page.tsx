import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { listRsvps } from "@/lib/store";
import { removeRsvp } from "./actions";
import AdminNav from "./AdminNav";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin — NOCTURNE 11",
  robots: { index: false, follow: false },
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

async function AdminContent() {
  if (!(await isAdmin())) redirect("/admin/login");

  const rsvps = await listRsvps();
  const accepted = rsvps.filter((r) => r.attendance === "accept");
  const declined = rsvps.length - accepted.length;
  const headcount = accepted.reduce((n, r) => n + (r.guests || 1), 0);

  return (
    <main className={styles.page}>
      <AdminNav
        current="responses"
        title="Responses"
        extra={
          <a href="/admin/export" className={styles.secondary}>
            Export CSV
          </a>
        }
      />

      <section className={styles.stats} aria-label="Summary">
        <div className={styles.stat}>
          <span className={styles.statNum}>{rsvps.length}</span>
          <span className={styles.statLabel}>Responses</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{accepted.length}</span>
          <span className={styles.statLabel}>Accepted</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{declined}</span>
          <span className={styles.statLabel}>Declined</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{headcount}</span>
          <span className={styles.statLabel}>Expected guests</span>
        </div>
      </section>

      {rsvps.length === 0 ? (
        <p className={styles.empty}>No responses yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Response</th>
                <th>Guests</th>
                <th>Meal</th>
                <th>Dietary / access</th>
                <th>Request</th>
                <th>Received</th>
                <th>
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <span className={r.attendance === "accept" ? styles.badgeYes : styles.badgeNo}>
                      {r.attendance === "accept" ? "Accepted" : "Declined"}
                    </span>
                  </td>
                  <td>
                    {r.attendance === "accept"
                      ? `${r.guests || 1}${r.companion ? ` (+ ${r.companion})` : ""}`
                      : "—"}
                  </td>
                  <td>{r.meal || "—"}</td>
                  <td>{r.dietary || "—"}</td>
                  <td>{r.request || "—"}</td>
                  <td className={styles.nowrap}>{fmt.format(new Date(r.createdAt))}</td>
                  <td>
                    <form action={removeRsvp}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className={styles.delete}
                        aria-label={`Delete response from ${r.name}`}
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className={styles.page} aria-busy="true" />}>
      <AdminContent />
    </Suspense>
  );
}
