"use client";

import { useEffect, useState } from "react";
import { formatCountdown as fmt } from "@/lib/event";

/** Live countdown. Server renders the same value for the first paint, then it ticks each 30s. */
export default function Countdown({ to, initial }: { to: string; initial: string }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    const tick = () => setText(fmt(Math.max(0, new Date(to).getTime() - Date.now())));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [to]);
  return <span suppressHydrationWarning>{text}</span>;
}
