import Button from "@/components/ui/button";

export default function FilterPanel({
  statuses,
  rounds,
  statusFilter,
  roundFilter,
  onStatusChange,
  onRoundChange,
  onReset,
}) {
  return (
    <div className="glass-panel rounded-[1.25rem] p-4 md:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
        Filters
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs text-textMuted">
          Round
          <select
            value={roundFilter}
            onChange={(event) => onRoundChange(event.target.value)}
            className="focus-ring mt-1 block w-full rounded-2xl border-2 border-slate-900 bg-panel px-3 py-2 text-sm text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"
          >
            <option value="all">All rounds</option>
            {rounds.map((round) => (
              <option key={round} value={round.toLowerCase()}>
                {round}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-textMuted">
          Status
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="focus-ring mt-1 block w-full rounded-2xl border-2 border-slate-900 bg-panel px-3 py-2 text-sm text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status.toLowerCase()}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <Button variant="secondary" onClick={onReset} type="button">
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
