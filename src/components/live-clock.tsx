"use client";

import { useEffect, useState } from "react";

/** Shows the viewer's local time, ticking every 30s, so the kitchen screen
 *  visibly reads as "live". Renders nothing on the server to avoid a
 *  timezone-driven hydration mismatch. */
export function LiveClock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleString("en-US", {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-xs text-muted-foreground tabular-nums">{now ?? ""}</span>;
}
