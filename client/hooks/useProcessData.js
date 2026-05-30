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
  const eventSourceRef = useRef(null);

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
      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("[EventSource] Failed to initialize:", error.message);
      setIsStreamConnected(false);
      return undefined;
    }

    const handleConnected = () => {
      console.log("[EventSource] Connected successfully");
      setIsStreamConnected(true);
      setOfflineHint(false);
    };

    const handleProcessUpdated = () => {
      console.log("[EventSource] Process update received");
      setOfflineHint(false);

      if (typeof refetchRef.current === "function") {
        refetchRef.current();
      }
    };

    const handleError = (error) => {
      console.error("[EventSource] Connection error:", error);
      setIsStreamConnected(false);
      setOfflineHint(true);
      
      // Log more details about the error
      if (eventSource.readyState === window.EventSource.CONNECTING) {
        console.warn("[EventSource] Attempting to reconnect...");
      } else if (eventSource.readyState === window.EventSource.CLOSED) {
        console.warn("[EventSource] Connection closed by server");
      } else {
        console.warn("[EventSource] Unknown error state");
      }
    };

    eventSource.onopen = handleConnected;
    eventSource.onerror = handleError;
    eventSource.addEventListener("connected", handleConnected);
    eventSource.addEventListener("processUpdated", handleProcessUpdated);

    return () => {
      console.log("[EventSource] Cleaning up connection");
      eventSource.removeEventListener("connected", handleConnected);
      eventSource.removeEventListener("processUpdated", handleProcessUpdated);
      eventSource.close();
      eventSourceRef.current = null;
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
