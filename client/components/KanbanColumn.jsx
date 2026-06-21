import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

import StudentCard from "@/components/StudentCard";

function roundTypeTone(roundType) {
  return "bg-neutral-100/80 text-neutral-600 border-neutral-200/60 dark:bg-neutral-900/80 dark:text-neutral-400 dark:border-neutral-800/60";
}

function roundTypeLabel(roundType) {
  if (!roundType) {
    return "Custom";
  }

  return roundType
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(^\s*)\w/g, (match) => match.toUpperCase());
}

export default function KanbanColumn({ column, showDepartment = false }) {
  const students = column.students || [];
  const listRef = useRef(null);
  const [showBottomFade, setShowBottomFade] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const update = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 2;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      setShowBottomFade(hasOverflow && !atBottom);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [students.length]);

  return (
    /* Fixed height on mobile (380px), full height on lg+ via flex-1 in KanbanBoard */
    <section className="glass-panel bg-card border border-border rounded-lg flex flex-col w-full h-[380px] lg:h-full lg:min-w-[300px] lg:max-w-[360px] flex-shrink-0">
      {/* ---- Header (never scrolls) ---- */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {column.roundName}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            Stage {column.order}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="rounded-[4px] border border-border bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-foreground">
            {students.length}
          </span>
          <span
            className={`rounded-[4px] border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.05em] ${roundTypeTone(column.roundType)}`}
          >
            {roundTypeLabel(column.roundType)}
          </span>
        </div>
      </header>

      {/* ---- Scrollable student list ---- */}
      <div className="relative flex-1 overflow-hidden">
        <motion.div
          ref={listRef}
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.04 },
            },
          }}
        >
          {students.length === 0 ? (
            <p className="rounded-[6px] border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground text-center font-sans">
              No candidates in this stage yet.
            </p>
          ) : (
            students.map((student) => (
              <motion.div
                key={`${student.studentDatabaseId}-${student.updatedAt || ""}`}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <StudentCard student={student} showDepartment={showDepartment} />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Bottom fade + scroll hint */}
        {showBottomFade && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent flex items-end justify-center pb-1.5">
            <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground shadow-xs">
              scroll ↓
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
