"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import styles from "../admin.module.css";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <main className={styles.loginWrap}>
      <form action={action} className={styles.loginCard}>
        <p className={styles.eyebrow}>LYST / 07 · Admin</p>
        <h1 className={styles.loginTitle}>Sign in</h1>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className={styles.input}
        />
        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className={styles.primary}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
