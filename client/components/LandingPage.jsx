import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { useProcessStore } from "@/store/processStore";
import { fetchActiveProcesses } from "@/utils/api";
import Omnibar from "@/components/Omnibar";
import NetworkLogTicker from "@/components/NetworkLogTicker";

export default function LandingPage() {
  const router = useRouter();
  const hydrateFromStorage = useProcessStore((state) => state.hydrateFromStorage);
  const processName = useProcessStore((state) => state.processName);
  const recentProcesses = useProcessStore((state) => state.recentProcesses);
  const setProcessName = useProcessStore((state) => state.setProcessName);
  const removeRecentProcess = useProcessStore((state) => state.removeRecentProcess);

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

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-6 bg-background text-foreground overflow-hidden">
      <div className="landing-grid" aria-hidden="true" />
      
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border hidden lg:block" style={{ left: 'clamp(40px, 6vw, 120px)' }}></div>

      <nav className="absolute top-6 right-6 flex items-center gap-5 text-sm font-medium text-muted-foreground w-full justify-end px-6 max-w-7xl mx-auto">
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
      </nav>

      <motion.section
        className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-6 mt-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
          Where Do I Stand?
        </h1>
        
        <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
          Dynamic interview tracking dashboard. Enter the company name or recruitment process key below to launch the placement board.
        </p>

        <div className="w-full max-w-lg mt-4">
          <Omnibar 
            options={processOptions} 
            recentProcesses={recentProcesses} 
            setProcessName={setProcessName} 
            removeRecentProcess={removeRecentProcess}
          />
        </div>

        <div className="flex gap-4 items-center text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] pt-6 select-none">
          <span>Awaiting Events</span>
          <span>&bull;</span>
          <span>Verified Schemas</span>
        </div>
      </motion.section>

      <NetworkLogTicker />
    </main>

  );
}
