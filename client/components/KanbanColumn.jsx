import { useEffect, useRef, useState } from "react";
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
    <section className="glass-panel flex min-h-[320px] w-full flex-col rounded-lg p-4 lg:min-h-0 lg:h-full lg:min-w-[320px] lg:max-w-[360px] bg-card border border-border">
      <header className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{column.roundName}</h2>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Stage {column.order}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="rounded-[4px] border border-border bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-foreground">
            {students.length}
          </span>
          <span
            className={`rounded-[4px] border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.05em] ${roundTypeTone(
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
          className="min-h-0 space-y-2 overflow-y-auto pb-10 pr-1 lg:overflow-y-hidden"
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
                <StudentCard student={student} />
              </motion.div>
            ))
          )}
        </motion.div>

        {showMoreHint ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
            <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground shadow-xs">
              ... overflow
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

