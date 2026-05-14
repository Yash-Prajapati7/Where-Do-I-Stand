import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useProcessStore } from "@/store/processStore";
import { fetchActiveProcesses, normalizeProcessInput } from "@/utils/api";

export default function LandingPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const hydrateFromStorage = useProcessStore((state) => state.hydrateFromStorage);
  const processName = useProcessStore((state) => state.processName);
  const recentProcesses = useProcessStore((state) => state.recentProcesses);
  const setProcessName = useProcessStore((state) => state.setProcessName);

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processQuery = useQuery({
    queryKey: ["active-processes"],
    queryFn: fetchActiveProcesses,
    staleTime: 60000,
    refetchInterval: 30000,
    retry: 1,
  });

  const activeProcesses = processQuery.data?.processes || [];

  const processOptions = useMemo(() => {
    const processKeys = activeProcesses
      .map((processItem) => processItem.processIdentifier || processItem.processName)
      .filter(Boolean);

    return [...new Set([...recentProcesses, ...processKeys])];
  }, [recentProcesses, activeProcesses]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!inputValue && processName) {
      setInputValue(processName);
    }
  }, [processName, inputValue]);

  async function navigateToDashboard(rawValue) {
    const normalized = normalizeProcessInput(rawValue);

    if (!normalized) {
      setError("Enter a valid company or process name.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    setProcessName(normalized);

    try {
      await router.push(`/dashboard/${encodeURIComponent(normalized)}`);
    } catch (navigationError) {
      setError("Unable to open dashboard. Please retry.");
      setIsSubmitting(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    navigateToDashboard(inputValue);
  }

  return (
    <main className="landing-bg page-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-6">
      <div className="landing-grid" aria-hidden="true" />

      {/* Floating task bar (About / FAQ) */}
      <div className="taskbar">
        <div className="hidden sm:flex gap-2">
          <Link href="/about" className="task-btn">About</Link>
          <Link href="/faq" className="task-btn">FAQ</Link>
        </div>
        <button
          className="sm:hidden hamburger"
          aria-label="Open menu"
          onClick={() => setMenuOpen((s) => !s)}
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="18" height="2" fill="#000" />
            <rect y="5" width="18" height="2" fill="#000" />
            <rect y="10" width="18" height="2" fill="#000" />
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <div className="mobile-menu">
          <Link href="/about" className="block px-3 py-2">About</Link>
          <Link href="/faq" className="block px-3 py-2">FAQ</Link>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full bg-[#ffd9c8]/35 blur-3xl" />
        <div className="absolute right-[-6%] top-[8%] h-80 w-80 rounded-full bg-[#c5dbff]/35 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[18%] h-96 w-96 rounded-full bg-[#d7efe3]/35 blur-3xl" />
      </div>

      <motion.section
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] glass-panel p-6 md:p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">
          <span className="soft-pill rounded-full px-3 py-1">Where Do I Stand</span>
          <span className="rounded-full border border-slate-900 bg-panel px-3 py-1 text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.12)]">
            Placement tracking
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Placement Interview Tracking with live visibility.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-textMuted md:text-base">
              Enter the company or process name to launch the real-time placement progression board.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-textPrimary">
              <span className="soft-pill rounded-full px-3 py-2">Off-white grid canvas</span>
              <span className="soft-pill rounded-full px-3 py-2">Pastel surfaces</span>
              <span className="soft-pill rounded-full px-3 py-2">Neobrutalist outline</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border-2 border-slate-900 bg-panel p-4 shadow-[6px_6px_0_0_rgba(31,26,23,0.14)] md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
              Quick start
            </p>
            <ol className="mt-3 space-y-2 text-sm text-textPrimary">
              <li className="flex gap-3"><span className="font-bold text-accent">01</span><span>Type a process name and open the board.</span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">02</span><span>Use recent processes for fast switching.</span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">03</span><span>Track candidates across rounds in real time.</span></li>
            </ol>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
              Enter Company / Process Name
            </label>
            <Input
              ref={inputRef}
              list="wdis-process-options"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Example: tcs-day-1"
              autoComplete="off"
              aria-invalid={Boolean(error)}
            />
            <datalist id="wdis-process-options">
              {processOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner label="Opening dashboard" size="sm" /> : "View Dashboard"}
          </Button>
        </form>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
            Recent Processes
          </p>
          {recentProcesses.length === 0 ? (
            <p className="text-sm text-textMuted">No recent process yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentProcesses.map((recent) => (
                <button
                  key={recent}
                  type="button"
                  onClick={() => {
                    setInputValue(recent);
                    navigateToDashboard(recent);
                  }}
                  className="focus-ring rounded-full border-2 border-slate-900 bg-panel px-3 py-1.5 text-sm text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.12)] hover:bg-panelSoft"
                >
                  {recent}
                </button>
              ))}
            </div>
          )}
        </div>

        {processQuery.isFetching ? (
          <div className="mt-4 text-sm text-textMuted">
            <LoadingSpinner label="Refreshing active processes" size="sm" />
          </div>
        ) : null}
      </motion.section>
    </main>
  );
}
