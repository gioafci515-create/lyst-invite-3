"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "lyst_read_notices";
const EVENT_NAME = "lyst-read-change";

function snapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT_NAME, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT_NAME, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Per-device "read" state for notifications (stored in localStorage, never sent to the server). */
export function useReadIds() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const read = new Set<string>(JSON.parse(raw) as string[]);

  const markRead = useCallback((ids: string[]) => {
    try {
      const next = new Set<string>(JSON.parse(snapshot()) as string[]);
      ids.forEach((id) => next.add(id));
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      /* storage unavailable: read state simply won't persist */
    }
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { read, markRead };
}
