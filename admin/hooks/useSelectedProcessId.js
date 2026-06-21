import { useEffect, useState } from "react";

const STORAGE_KEY = "wdis:admin:selected-process-id";
const SYNC_EVENT = "wdis:admin:process-sync";

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

  const updateSelectedProcessId = (newId) => {
    setSelectedProcessId(newId);
    safeWrite(newId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: newId }));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleSync = (e) => {
      setSelectedProcessId(e.detail);
    };

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setSelectedProcessId(e.newValue || "");
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    hydrated,
    selectedProcessId,
    setSelectedProcessId: updateSelectedProcessId,
  };
}

