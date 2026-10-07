"use client";

import { useReadIds } from "../(app)/read-state";

/** Count of notifications this device has not opened yet. */
export default function Alerts({ ids, suffix = "" }: { ids: string[]; suffix?: string }) {
  const { read } = useReadIds();
  const n = ids.filter((id) => !read.has(id)).length;
  return (
    <span suppressHydrationWarning>
      {n}
      {suffix}
    </span>
  );
}
