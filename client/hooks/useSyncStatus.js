import { useMemo } from "react";

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "No sync yet";
  }

  const deltaSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  );

  if (deltaSeconds < 5) {
    return "just now";
  }

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const minutes = Math.floor(deltaSeconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function useSyncStatus(meta, isFetching, isError) {
  return useMemo(() => {
    const lastUpdated = meta?.lastUpdated;

    if (isError) {
      return {
        tone: "danger",
        label: "Connection issue",
        detail: "Unable to sync with backend right now",
        lastSyncLabel: formatRelativeTime(lastUpdated),
      };
    }

    if (isFetching) {
      return {
        tone: "accent",
        label: "Syncing",
        detail: "Refreshing process progress from database",
        lastSyncLabel: formatRelativeTime(lastUpdated),
      };
    }

    return {
      tone: "success",
      label: "Connected",
      detail: "Real-time process board is up to date",
      lastSyncLabel: formatRelativeTime(lastUpdated),
    };
  }, [meta, isFetching, isError]);
}
