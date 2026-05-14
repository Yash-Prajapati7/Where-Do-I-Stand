import { memo } from "react";

function StudentCard({ student }) {
  const sapId = String(student.sapId || "").trim() || "-";

  return (
    <article className="animate-floatIn rounded-[1.25rem] border-2 border-slate-900 bg-panelSoft p-4 shadow-[4px_4px_0_0_rgba(31,26,23,0.1)]">
      <h3 className="font-display text-base font-semibold text-textPrimary">
        {student.fullName || "Unnamed"}
      </h3>

      <dl className="mt-3 space-y-2 text-sm text-textMuted">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-medium">SAP ID</dt>
          <dd className="font-mono text-textPrimary">{sapId}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-medium">Branch</dt>
          <dd className="text-textPrimary">{student.branch || "-"}</dd>
        </div>
      </dl>
    </article>
  );
}

export default memo(StudentCard);
