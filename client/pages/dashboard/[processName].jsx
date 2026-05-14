import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";

import KanbanBoard from "@/components/KanbanBoard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import useProcessData from "@/hooks/useProcessData";
import useSyncStatus from "@/hooks/useSyncStatus";
import { useProcessStore } from "@/store/processStore";
import {
  applySearchAndFilters,
  extractFilterOptions,
} from "@/utils/filterUtils";
import { normalizeProcessInput } from "@/utils/api";
import { ensureBoardShape } from "@/utils/sheetDataTransformer";

function syncToneClass(tone) {
  if (tone === "danger") {
    return "border-rose-300 bg-[#ffe0e0] text-rose-950";
  }

  if (tone === "warning") {
    return "border-amber-300 bg-[#ffecc8] text-amber-950";
  }

  if (tone === "accent") {
    return "border-sky-300 bg-[#d8ecff] text-slate-900";
  }

  return "border-emerald-300 bg-[#d8f2e8] text-slate-900";
}

function decodeProcessParam(paramValue) {
  try {
    return normalizeProcessInput(decodeURIComponent(paramValue || ""));
  } catch (error) {
    return normalizeProcessInput(paramValue || "");
  }
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-slate-900 bg-panel text-textPrimary transition hover:bg-panelSoft shadow-[3px_3px_0_0_rgba(31,26,23,0.1)]"
    >
      {children}
    </button>
  );
}

function DashboardModal({ isOpen, title, description, onClose, children, footer }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="glass-panel w-full max-w-xl overflow-hidden rounded-[2rem]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="border-b border-slate-900/10 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">{title}</h2>
                  {description ? (
                    <p className="mt-1 text-sm text-textMuted">{description}</p>
                  ) : null}
                </div>
                <Button variant="secondary" onClick={onClose} type="button">
                  Close
                </Button>
              </div>
            </header>

            <div className="p-4">{children}</div>

            {footer ? <footer className="border-t border-slate-900/10 p-4">{footer}</footer> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSapId, setDraftSapId] = useState("");
  const sapInputRef = useRef(null);

  const hydrateFromStorage = useProcessStore((state) => state.hydrateFromStorage);
  const setProcessName = useProcessStore((state) => state.setProcessName);
  const statusFilter = useProcessStore((state) => state.statusFilter);
  const setStatusFilter = useProcessStore((state) => state.setStatusFilter);
  const roundFilter = useProcessStore((state) => state.roundFilter);
  const setRoundFilter = useProcessStore((state) => state.setRoundFilter);
  const resetFilters = useProcessStore((state) => state.resetFilters);
  const sapId = useProcessStore((state) => state.sapId);
  const setSapId = useProcessStore((state) => state.setSapId);
  const setSapFilterEnabled = useProcessStore((state) => state.setSapFilterEnabled);

  const routeParam = Array.isArray(router.query.processName)
    ? router.query.processName[0]
    : router.query.processName;

  const processName = useMemo(() => decodeProcessParam(routeParam), [routeParam]);

  const { data, isLoading, isFetching, isError, refetch, error } = useProcessData(processName);

  const board = useMemo(() => ensureBoardShape(data?.board), [data?.board]);
  const options = useMemo(() => extractFilterOptions(board), [board]);

  const filteredBoard = useMemo(
    () =>
      applySearchAndFilters(board, {
        searchTerm: "",
        statusFilter,
        roundFilter,
        sapId,
        sapFilterEnabled: true,
      }),
    [board, statusFilter, roundFilter, sapId]
  );

  const visibleCount = filteredBoard.reduce(
    (total, column) => total + column.students.length,
    0
  );

  const roundCount = data?.process?.rounds?.length || 0;
  const processLabel = data?.process?.processName || processName || "-";

  const syncStatus = useSyncStatus(data?.meta, isFetching, isError);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    setSapFilterEnabled(true);
  }, [setSapFilterEnabled]);

  useEffect(() => {
    if (processName) {
      setProcessName(processName);
    }
  }, [processName, setProcessName]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    setDraftSapId(sapId || "");

    const raf = requestAnimationFrame(() => {
      sapInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [searchOpen, sapId]);

  if (router.isReady && !processName) {
    return (
      <main className="page-shell mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
        <section className="glass-panel rounded-[1.5rem] p-6">
          <h1 className="font-display text-2xl font-semibold">Invalid Process</h1>
          <p className="mt-2 text-sm text-textMuted">
            This process name is empty or invalid. Return to landing page and try again.
          </p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Back To Landing Page
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen p-4 md:p-6 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4">
        <motion.header
          className="glass-panel rounded-[1.5rem] p-4 md:p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[220px]">
              <p className="text-xs uppercase tracking-[0.16em] text-accent">WDIS Dashboard</p>
              <h1 className="mt-1 font-display text-2xl font-semibold md:text-3xl">
                {processLabel}
              </h1>
              <p className="mt-1 text-sm text-textMuted">
                {sapId ? (
                  <>
                    SAP ID <span className="font-mono text-textPrimary">{sapId}</span>
                  </>
                ) : (
                  "SAP ID not set"
                )}
                <span className="mx-2">•</span>
                Showing {visibleCount} cards • {roundCount} rounds
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-2xl border-2 px-3 py-2 text-sm shadow-[3px_3px_0_0_rgba(31,26,23,0.1)] ${syncToneClass(syncStatus.tone)}`}
                role="status"
                aria-live="polite"
              >
                <p className="font-semibold">{syncStatus.label}</p>
                <p className="text-xs opacity-90">{syncStatus.detail}</p>
                <p className="text-xs opacity-80">Last sync {syncStatus.lastSyncLabel}</p>
              </div>

              <div className="flex items-center gap-2">
                <IconButton label="Search by SAP ID" onClick={() => setSearchOpen(true)}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </IconButton>

                <IconButton label="Filters" onClick={() => setFiltersOpen(true)}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />
                  </svg>
                </IconButton>
              </div>

              <Button variant="secondary" onClick={() => router.push("/")}
              >
                Change Process
              </Button>
            </div>
          </div>
        </motion.header>

        <section className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <div className="glass-panel rounded-[1.25rem] p-6">
              <LoadingSpinner label="Loading process board" />
            </div>
          ) : null}

          {isError && !data ? (
            <div className="glass-panel rounded-[1.25rem] p-6">
              <h2 className="font-display text-xl font-semibold text-rose-800">Unable to load dashboard</h2>
              <p className="mt-2 text-sm text-textMuted">
                {error?.message || "An error occurred while loading process data."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => refetch()}>Retry Now</Button>
                <Button variant="secondary" onClick={() => router.push("/")}
                >
                  Back To Landing
                </Button>
              </div>
            </div>
          ) : null}

          {!isLoading && board.length === 0 ? (
            <div className="glass-panel rounded-[1.25rem] p-6">
              <h2 className="font-display text-xl font-semibold">No process board found</h2>
              <p className="mt-2 text-sm text-textMuted">
                This process has no configured rounds yet. Ask admin to add rounds and student data.
              </p>
            </div>
          ) : null}

          {board.length > 0 && !isLoading ? (
            <div className="min-h-0 flex-1">
              {!sapId ? (
                <div className="glass-panel flex h-full flex-col items-start justify-center rounded-[1.25rem] p-6">
                  <h2 className="font-display text-xl font-semibold">Enter your SAP ID</h2>
                  <p className="mt-2 text-sm text-textMuted">
                    Use the search icon to enter your SAP ID and view your cards.
                  </p>
                </div>
              ) : visibleCount === 0 ? (
                <div className="glass-panel flex h-full flex-col items-start justify-center rounded-[1.25rem] p-6">
                  <h2 className="font-display text-xl font-semibold">No record found</h2>
                  <p className="mt-2 text-sm text-textMuted">
                    No cards match SAP ID <span className="font-mono text-textPrimary">{sapId}</span>.
                    Double-check the SAP ID and try again.
                  </p>
                </div>
              ) : (
                <KanbanBoard board={filteredBoard} />
              )}
            </div>
          ) : null}
        </section>
      </div>

      <DashboardModal
        isOpen={searchOpen}
        title="Search by SAP ID"
        description="Enter your SAP ID to view your cards."
        onClose={() => setSearchOpen(false)}
        footer={
          <Button
            type="button"
            onClick={() => {
              setSapId(draftSapId);
              setSearchOpen(false);
            }}
          >
            View
          </Button>
        }
      >
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
          SAP ID
        </label>
        <Input
          ref={sapInputRef}
          value={draftSapId}
          onChange={(event) => setDraftSapId(event.target.value)}
          placeholder="Enter your SAP ID"
          aria-label="SAP ID"
          autoComplete="off"
          className="mt-2"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setSapId(draftSapId);
              setSearchOpen(false);
            }
          }}
        />
      </DashboardModal>

      <DashboardModal
        isOpen={filtersOpen}
        title="Filters"
        description="Narrow results by round or status."
        onClose={() => setFiltersOpen(false)}
        footer={
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              resetFilters();
            }}
          >
            Reset
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-textMuted">
            Round
            <select
              value={roundFilter}
              onChange={(event) => setRoundFilter(event.target.value)}
              className="focus-ring mt-1 block w-full rounded-2xl border-2 border-slate-900 bg-panel px-3 py-2 text-sm text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"
            >
              <option value="all">All rounds</option>
              {options.rounds.map((round) => (
                <option key={round} value={round.toLowerCase()}>
                  {round}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-textMuted">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="focus-ring mt-1 block w-full rounded-2xl border-2 border-slate-900 bg-panel px-3 py-2 text-sm text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"
            >
              <option value="all">All statuses</option>
              {options.statuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </DashboardModal>
    </main>
  );
}
