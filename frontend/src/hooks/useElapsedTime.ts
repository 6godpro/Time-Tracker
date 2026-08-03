import { useEffect, useState } from "react";

/**
 * Ticks once a second so duration displays stay live between
 * server refetches. The server timestamp is always the source of
 * truth; this just re-renders the client-side formatting.
 */
export function useTick(intervalMs = 1000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
