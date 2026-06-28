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
import { ArrowLeftFromLine, ChevronLeft, Funnel, Search, Menu } from "lucide-react";

function syncToneClass(tone) {
  if (tone === "danger") {
    return "border-red-200/60 bg-red-50/50 text-red-700 dark:border-red-950/40 dark:bg-red-950/10 dark:text-red-400";
  }

  if (tone === "warning") {
    return "border-amber-200/60 bg-amber-50/50 text-amber-700 dark:border-amber-950/40 dark:bg-amber-950/10 dark:text-amber-400";
  }

  if (tone === "accent") {
    return "border-blue-200/60 bg-blue-50/50 text-blue-700 dark:border-blue-950/40 dark:bg-blue-950/10 dark:text-blue-400";
  }

  return "border-emerald-200/60 bg-emerald-50/50 text-emerald-700 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-400";
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
      className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-border bg-card text-foreground transition hover:bg-muted shadow-sm"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="bg-card border border-border w-full max-w-md overflow-hidden rounded-lg shadow-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <header className="border-b border-border p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                  {description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  ) : null}
                </div>
                <button 
                  onClick={onClose} 
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="p-5">{children}</div>

            {footer ? <footer className="border-t border-border bg-muted/30 px-5 py-4 flex justify-end gap-2">{footer}</footer> : null}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftSapId, setDraftSapId] = useState("");
  const [showDepartment, setShowDepartment] = useState(false);
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
      setSapId(""); // Clear SAP ID to show the entire board initially
    }
  }, [processName, setProcessName, setSapId]);

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
    <main className="page-shell min-h-screen p-4 md:p-6 lg:h-screen lg:overflow-hidden bg-background">
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4">
        <motion.header
          className="glass-panel rounded-lg p-3 md:p-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[220px]">
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl leading-none">
                {processLabel}
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <div
                className={`rounded-[6px] border px-3 py-1.5 text-xs shadow-xs transition-colors flex flex-col gap-0.5 ${syncToneClass(syncStatus.tone)}`}
                role="status"
                aria-live="polite"
              >
                <div className="text-[10px] opacity-80 font-mono">Updated {syncStatus.lastSyncLabel}</div>
              </div>

              <div className="flex items-center gap-2">
                <IconButton label="Search by SAP ID" onClick={() => setSearchOpen(true)}>
                  <Search />
                </IconButton>

                <IconButton label="Filters" onClick={() => setFiltersOpen(true)}>
                  <Funnel />
                </IconButton>
              </div>

              <Button variant="secondary" onClick={() => router.push("/")}>
                <ChevronLeft/> <span>Change Process</span>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2 relative">
              <IconButton label="Search by SAP ID" onClick={() => setSearchOpen(true)}>
                <Search />
              </IconButton>

              <IconButton label="Open Menu" onClick={() => setMenuOpen(!menuOpen)}>
                <Menu className="h-5 w-5 text-foreground" />
              </IconButton>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-border bg-card p-3 shadow-lg flex flex-col gap-3"
                  >
                    <div
                      className={`rounded-[6px] border px-3 py-1.5 text-xs shadow-xs transition-colors flex flex-col gap-0.5 ${syncToneClass(syncStatus.tone)}`}
                      role="status"
                      aria-live="polite"
                    >
                      <div className="text-[10px] opacity-80 font-mono">Updated {syncStatus.lastSyncLabel}</div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFiltersOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full justify-start text-xs h-9 px-3"
                    >
                      <Funnel className="h-3.5 w-3.5 mr-2" />
                      Filters
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        router.push("/");
                        setMenuOpen(false);
                      }}
                      className="w-full justify-start text-xs h-9 px-3"
                    >
                      Change Process
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        <section className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <div className="glass-panel rounded-lg p-8 flex justify-center items-center">
              <LoadingSpinner label="Loading process board" />
            </div>
          ) : null}

          {isError && !data ? (
            <div className="glass-panel rounded-lg p-6 border border-rose-500/20 bg-rose-950/10 max-w-lg mx-auto mt-12">
              <h2 className="text-base font-bold text-rose-500">
                {error?.response?.status === 404 ? "Process Not Found" : "Unable to load dashboard"}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {error?.response?.status === 404
                  ? "The requested placement process is absent, or you have entered an incorrect process identifier. Please verify the name and try again."
                  : (error?.response?.data?.message || error?.message || "An error occurred while loading process data. Please check your internet connection and try again.")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {error?.response?.status !== 404 && (
                  <Button onClick={() => refetch()}>Retry Now</Button>
                )}
                <Button variant="secondary" onClick={() => router.push("/")}>
                  Back To Landing
                </Button>
              </div>
            </div>
          ) : null}



          {board.length > 0 && !isLoading ? (
            <div className="min-h-0 flex-1 h-full">
              {sapId && visibleCount === 0 ? (
                <div className="glass-panel flex h-64 flex-col items-center justify-center rounded-lg p-6 max-w-md mx-auto mt-12 text-center">
                  <h2 className="text-base font-semibold">No Records Found</h2>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    No active cards found for <span className="font-mono text-foreground font-medium">{sapId}</span> in this process.
                  </p>
                  <Button className="mt-4" variant="secondary" onClick={() => setSearchOpen(true)}>
                    Check SAP ID
                  </Button>
                </div>
              ) : (
                <KanbanBoard board={filteredBoard} showDepartment={showDepartment} statusColors={data?.process?.statusColors} statusNames={data?.process?.statusNames} />
              )}
            </div>
          ) : null}
        </section>
      </div>

      <DashboardModal
        isOpen={searchOpen}
        title="Search by SAP ID"
        description="Enter your exact academic SAP ID to retrieve active placement cards."
        onClose={() => setSearchOpen(false)}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setSearchOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSapId(draftSapId);
                setSearchOpen(false);
              }}
            >
              Verify & View
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Academic SAP ID
          </label>
          <Input
            ref={sapInputRef}
            value={draftSapId}
            onChange={(event) => setDraftSapId(event.target.value)}
            placeholder="e.g. 500092301"
            aria-label="SAP ID"
            autoComplete="off"
            className="mt-1 font-mono uppercase"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setSapId(draftSapId);
                setSearchOpen(false);
              }
            }}
          />
        </div>
      </DashboardModal>

      <DashboardModal
        isOpen={filtersOpen}
        title="Filter Dashboard"
        description="Filter cards by specific rounds or progress status."
        onClose={() => setFiltersOpen(false)}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetFilters();
                setFiltersOpen(false);
              }}
            >
              Reset Filters
            </Button>
            <Button
              type="button"
              onClick={() => setFiltersOpen(false)}
            >
              Apply
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Round / Stage
            </label>
            <select
              value={roundFilter}
              onChange={(event) => setRoundFilter(event.target.value)}
              className="mt-1 block w-full rounded-[6px] border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-foreground focus:ring-1 focus:ring-foreground transition-all shadow-sm"
            >
              <option value="all">All stages</option>
              {options.rounds.map((round) => (
                <option key={round} value={round.toLowerCase()}>
                  {round}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Progress Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 block w-full rounded-[6px] border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-foreground focus:ring-1 focus:ring-foreground transition-all shadow-sm"
            >
              <option value="all">All statuses</option>
              {options.statuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 pt-1 border-t border-border">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Display Options
            </p>
            <button
              type="button"
              onClick={() => setShowDepartment((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-[6px] border px-3 py-2 text-xs font-medium transition-all shadow-sm ${
                showDepartment
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border hover:border-foreground/40"
              }`}
              aria-pressed={showDepartment}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full transition-colors ${
                  showDepartment ? "bg-background" : "bg-muted-foreground"
                }`}
              />
              {showDepartment ? "Hide Department Names" : "Show Department Names"}
            </button>
          </div>
        </div>
      </DashboardModal>
    </main>
  );
}

