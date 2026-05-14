import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import StudentCard from "@/components/StudentCard";

function roundTypeTone(roundType) {
  const normalized = String(roundType || "").trim().toLowerCase();

  if (normalized === "groupdiscussion") {
    return "bg-[#ffe8bf] text-amber-950 border-amber-300";
  }

  if (normalized === "technicalinterview" || normalized === "hrinterview") {
    return "bg-[#d8ecff] text-slate-900 border-sky-300";
  }

  if (normalized === "pool") {
    return "bg-[#e8e7ff] text-slate-900 border-violet-300";
  }

  return "bg-[#d8f2e8] text-slate-900 border-emerald-300";
}

function roundTypeLabel(roundType) {
  if (!roundType) {
    return "Custom";
  }

  return roundType
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());
}

export default function KanbanColumn({ column }) {
  const students = column.students || [];
  const scrollRef = useRef(null);
  const [showMoreHint, setShowMoreHint] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return undefined;
    }

    const updateHint = () => {
      const hasOverflow = element.scrollHeight > element.clientHeight + 1;
      const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      setShowMoreHint(hasOverflow && !atBottom);
    };

    updateHint();
    element.addEventListener("scroll", updateHint, { passive: true });
    window.addEventListener("resize", updateHint);

    return () => {
      element.removeEventListener("scroll", updateHint);
      window.removeEventListener("resize", updateHint);
    };
  }, [students.length]);

  return (
    <section className="glass-panel flex min-h-[320px] w-full flex-col rounded-[1.5rem] p-4 lg:min-h-0 lg:h-full lg:min-w-[330px] lg:max-w-[380px]">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-textPrimary">{column.roundName}</h2>
          <p className="mt-1 text-xs text-textMuted">Stage {column.order}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-slate-900 bg-panel px-2.5 py-1 text-xs font-semibold tracking-wide text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.12)]">
            {students.length}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${roundTypeTone(
              column.roundType
            )}`}
          >
            {roundTypeLabel(column.roundType)}
          </span>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <motion.div
          ref={scrollRef}
          className="min-h-0 space-y-3 overflow-y-auto pb-10 pr-1 lg:overflow-y-hidden"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {students.length === 0 ? (
            <p className="rounded-[1.25rem] border-2 border-dashed border-slate-900/20 bg-panel p-4 text-sm text-textMuted shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]">
              No students in this stage yet.
            </p>
          ) : (
            students.map((student) => (
              <motion.div
                key={`${student.studentDatabaseId}-${student.updatedAt || ""}`}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <StudentCard student={student} />
              </motion.div>
            ))
          )}
        </motion.div>

        {showMoreHint ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
            <span className="rounded-full border border-slate-900/15 bg-panel px-3 py-1 text-xs font-semibold text-textMuted backdrop-blur">
              ... and more
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
