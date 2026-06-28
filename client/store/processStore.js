import { create } from "zustand";

const LAST_PROCESS_KEY = "wdis:last-process";
const RECENT_PROCESSES_KEY = "wdis:recent-processes";
const SAP_ID_KEY = "wdis:sap-id";
const SAP_FILTER_KEY = "wdis:sap-filter-enabled";
const MAX_RECENT = 8;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSapId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const useProcessStore = create((set, get) => ({
  hydrated: false,
  processName: "",
  recentProcesses: [],
  searchTerm: "",
  statusFilter: "all",
  roundFilter: "all",
  sapId: "",
  sapFilterEnabled: true,

  hydrateFromStorage() {
    if (get().hydrated) {
      return;
    }

    const storedProcess = normalize(readStorage(LAST_PROCESS_KEY, ""));
    const storedRecents = readStorage(RECENT_PROCESSES_KEY, []).filter(Boolean);
    const storedSapId = normalizeSapId(readStorage(SAP_ID_KEY, ""));
    const storedSapFilterEnabled = Boolean(readStorage(SAP_FILTER_KEY, true));

    set({
      hydrated: true,
      processName: storedProcess,
      recentProcesses: storedRecents,
      sapId: storedSapId,
      sapFilterEnabled: storedSapFilterEnabled,
    });
  },

  setProcessName(value) {
    const normalized = normalize(value);

    if (!normalized) {
      return;
    }

    const recentProcesses = [
      normalized,
      ...get().recentProcesses.filter((item) => item !== normalized),
    ].slice(0, MAX_RECENT);

    writeStorage(LAST_PROCESS_KEY, normalized);
    writeStorage(RECENT_PROCESSES_KEY, recentProcesses);

    set({
      processName: normalized,
      recentProcesses,
    });
  },

  setSearchTerm(value) {
    set({ searchTerm: value ?? "" });
  },

  setStatusFilter(value) {
    set({ statusFilter: value || "all" });
  },

  setRoundFilter(value) {
    set({ roundFilter: value || "all" });
  },

  setSapId(value) {
    const normalized = normalizeSapId(value);
    writeStorage(SAP_ID_KEY, normalized);
    set({ sapId: normalized });
  },

  setSapFilterEnabled(enabled) {
    const nextValue = Boolean(enabled);
    writeStorage(SAP_FILTER_KEY, nextValue);
    set({ sapFilterEnabled: nextValue });
  },

  toggleSapFilter() {
    const nextValue = !get().sapFilterEnabled;
    writeStorage(SAP_FILTER_KEY, nextValue);
    set({ sapFilterEnabled: nextValue });
  },

  removeRecentProcess(value) {
    const normalized = normalize(value);
    const recentProcesses = get().recentProcesses.filter((item) => item !== normalized);
    writeStorage(RECENT_PROCESSES_KEY, recentProcesses);
    
    if (get().processName === normalized) {
      writeStorage(LAST_PROCESS_KEY, "");
      set({
        processName: "",
        recentProcesses,
      });
    } else {
      set({ recentProcesses });
    }
  },

  resetFilters() {
    set({
      searchTerm: "",
      statusFilter: "all",
      roundFilter: "all",
    });
  },
}));
