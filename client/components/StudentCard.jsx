import { memo } from "react";

function StudentCard({ student, showDepartment = false, statusColors, statusNames }) {
  const sapId = String(student.sapId || "").trim() || "-";
  const status = student.status || "notStarted";
  const statusColor = statusColors?.[status] || "#f3f4f6";

  const statusLabels = {
    notStarted: "Not Started",
    upNext: "Up Next",
    ongoing: "Ongoing",
    nextRound: "Next Round",
    rejected: "Rejected",
    onHold: "On Hold",
    awaitingResults: "Awaiting Results",
    ...(statusNames || {}),
  };

  return (
    <article
      className="rounded-[6px] border border-border bg-card p-3 shadow-sm hover:border-foreground/20 transition-all select-none duration-150 relative overflow-hidden"
      style={{ borderLeft: `4px solid ${statusColor}` }}
    >
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

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="font-mono text-muted-foreground">SAP:</span>
          <span className="font-mono text-foreground font-medium">{sapId}</span>
        </div>
        
        <span
          className="px-1 py-0.5 rounded-[3px] text-[8px] font-mono uppercase tracking-[0.02em] font-semibold border"
          style={{
            backgroundColor: `${statusColor}`, // ~11% opacity for light background tint
            borderColor: `${statusColor}`, // ~60% opacity for border
            color: "black",
          }}
        >
          {statusLabels[status] || status}
        </span>
      </div>

      {(student.groupNumber || student.venue || student.remarks) && (
        <div className="mt-2 pt-2 border-t border-border/60 text-[13px] space-y-1 text-muted-foreground">
          {student.groupNumber && (
            <div className="flex justify-between gap-1.5">
              <span>Group:</span>
              <span className="font-medium text-foreground">{student.groupNumber}</span>
            </div>
          )}
          {student.venue && (
            <div className="flex justify-between gap-1.5">
              <span>Venue:</span>
              <span className="font-medium text-foreground text-right break-words max-w-[70%]">{student.venue}</span>
            </div>
          )}
          {student.remarks && (
            <div className="mt-1.5 pt-1 border-t border-dashed border-border/40 text-[8.5px] text-muted-foreground/90 break-words leading-normal italic">
              {student.remarks}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default memo(StudentCard);
