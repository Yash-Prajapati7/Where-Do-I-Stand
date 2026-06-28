import { AnimatePresence, motion } from "framer-motion";

import Button from "@/components/ui/button";

function evaluationState(student) {
  const normalizedStatus = String(student.status || "").toLowerCase();

  if (normalizedStatus === "onhold") {
    return "Under Evaluation";
  }

  if (normalizedStatus === "upnext") {
    return "Up Next";
  }

  return "Awaited";
}

export default function WaitingRoomModal({ isOpen, onClose, students, lastSyncLabel }) {
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
            className="glass-panel max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-[2rem]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <header className="flex items-center justify-between border-b border-slate-900/10 p-4 md:p-5">
              <div>
                <h2 className="font-display text-xl font-semibold">Waiting Room</h2>
                <p className="text-sm text-textMuted">Pending outcomes • Last sync {lastSyncLabel}</p>
              </div>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </header>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {students.length === 0 ? (
                <p className="rounded-[1.25rem] border-2 border-dashed border-slate-900/20 bg-panel p-5 text-sm text-textMuted shadow-[4px_4px_0_0_rgba(31,26,23,0.08)]">
                  No students are currently waiting for result publication.
                </p>
              ) : (
                <ul className="space-y-3">
                  {students.map((student) => (
                    <li
                      key={`${student.studentDatabaseId}-${student.updatedAt || ""}`}
                      className="rounded-[1.25rem] border-2 border-slate-900 bg-panelSoft p-4 shadow-[4px_4px_0_0_rgba(31,26,23,0.1)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-base font-semibold text-textPrimary">
                          {student.fullName || "Unnamed"}
                        </p>
                        <span className="rounded-full border border-slate-900 bg-[#ffd9c8] px-2.5 py-1 text-xs font-semibold text-slate-900">
                          {evaluationState(student)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-textMuted">
                        {student.rollNumber || "-"} • {student.email || "-"} • {student.venue || "TBD"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
