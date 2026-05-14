import { useEffect, useState } from "react";

const STORAGE_KEY = "wdis:admin:selected-process-id";

function safeRead() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function safeWrite(value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    // Ignore storage errors
  }
}

export default function useSelectedProcessId() {
  const [hydrated, setHydrated] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState("");

  useEffect(() => {
    if (hydrated) {
      return;
    }

    setHydrated(true);
    setSelectedProcessId(safeRead());
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    safeWrite(selectedProcessId);
  }, [hydrated, selectedProcessId]);

  return {
    hydrated,
    selectedProcessId,
    setSelectedProcessId,
  };
}
