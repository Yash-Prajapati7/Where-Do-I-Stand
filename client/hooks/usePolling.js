import { useEffect, useMemo, useState } from "react";

const BASE_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_DEFAULT_POLL_INTERVAL_MS || 2500
);
const MAX_INTERVAL_MS = 15000;

export default function usePolling(isOffline) {
  const [backoffLevel, setBackoffLevel] = useState(0);

  useEffect(() => {
    if (isOffline) {
      setBackoffLevel((previous) => Math.min(previous + 1, 3));
    } else {
      setBackoffLevel(0);
    }
  }, [isOffline]);

  return useMemo(
    () => Math.min(BASE_INTERVAL_MS * 2 ** backoffLevel, MAX_INTERVAL_MS),
    [backoffLevel]
  );
}
