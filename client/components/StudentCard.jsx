import { memo } from "react";

function StudentCard({ student, showDepartment = false }) {
  const sapId = String(student.sapId || "").trim() || "-";

  return (
    <article className="rounded-[6px] border border-border bg-card p-3.5 shadow-sm hover:border-foreground/20 transition-all select-none duration-150">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1 flex-1">
          {student.fullName || "Unnamed"}
        </h3>
        {showDepartment && student.branch && (
          <span className="flex-shrink-0 font-mono text-[9px] text-muted-foreground uppercase border border-border/80 px-1 py-0.5 rounded-[3px] bg-muted/40">
            {student.branch}
          </span>
        )}
      </div>

      <dl className="mt-2.5 space-y-1.5 text-[11px] text-muted-foreground font-sans">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-normal opacity-70">SAP ID</dt>
          <dd className="font-mono text-foreground font-medium">{sapId}</dd>
        </div>
      </dl>
    </article>
  );
}

export default memo(StudentCard);
