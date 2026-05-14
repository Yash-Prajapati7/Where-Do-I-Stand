import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import usePolling from "@/hooks/usePolling";
import {
  buildProcessEventStreamUrl,
  fetchProcessData,
  normalizeProcessInput,
} from "@/utils/api";
import { ensureBoardShape } from "@/utils/sheetDataTransformer";

export default function useProcessData(processName) {
  const normalizedProcessName = useMemo(
    () => normalizeProcessInput(processName),
    [processName]
  );

  const [offlineHint, setOfflineHint] = useState(false);
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const pollInterval = usePolling(offlineHint);
  const refetchRef = useRef(null);

  const query = useQuery({
    queryKey: ["process-data", normalizedProcessName],
    queryFn: () => fetchProcessData(normalizedProcessName),
    enabled: Boolean(normalizedProcessName),
    refetchInterval: isStreamConnected ? false : pollInterval,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  useEffect(() => {
    refetchRef.current = query.refetch;
  }, [query.refetch]);

  const normalizedData = useMemo(() => {
    if (!query.data) {
      return null;
    }

    return {
      ...query.data,
      board: ensureBoardShape(query.data.board),
    };
  }, [query.data]);

  useEffect(() => {
    setOfflineHint(false);
    setIsStreamConnected(false);
  }, [normalizedProcessName]);

  useEffect(() => {
    setOfflineHint(Boolean(query.isError));
  }, [query.isError]);

  useEffect(() => {
    if (!normalizedProcessName) {
      return undefined;
    }

    if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
      return undefined;
    }

    let eventSource;

    try {
      eventSource = new window.EventSource(
        buildProcessEventStreamUrl(normalizedProcessName)
      );
    } catch (error) {
      setIsStreamConnected(false);
      return undefined;
    }

    const handleConnected = () => {
      setIsStreamConnected(true);
      setOfflineHint(false);
    };

    const handleProcessUpdated = () => {
      setOfflineHint(false);

      if (typeof refetchRef.current === "function") {
        refetchRef.current();
      }
    };

    const handleError = () => {
      setIsStreamConnected(false);
    };

    eventSource.onopen = handleConnected;
    eventSource.onerror = handleError;
    eventSource.addEventListener("connected", handleConnected);
    eventSource.addEventListener("processUpdated", handleProcessUpdated);

    return () => {
      eventSource.removeEventListener("connected", handleConnected);
      eventSource.removeEventListener("processUpdated", handleProcessUpdated);
      eventSource.close();
      setIsStreamConnected(false);
    };
  }, [normalizedProcessName]);

  return {
    ...query,
    data: normalizedData,
    pollInterval,
    processName: normalizedProcessName,
  };
}
