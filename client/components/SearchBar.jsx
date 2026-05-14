import Input from "@/components/ui/input";

export default function SearchBar({
  value,
  onChange,
  sapId,
  onSapIdChange,
  sapFilterEnabled,
}) {
  return (
    <div className="glass-panel rounded-[1.25rem] p-4 md:p-5">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
        Search Students
      </label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type name or roll number"
        aria-label="Search by name or roll number"
      />

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">
        SAP ID
      </label>
      <Input
        value={sapId}
        onChange={(event) => onSapIdChange(event.target.value)}
        placeholder="Enter your SAP ID"
        aria-label="SAP ID"
        autoComplete="off"
      />

      {sapFilterEnabled && !sapId ? (
        <p className="mt-2 text-xs text-amber-700">
          Enter your SAP ID to show only your record.
        </p>
      ) : null}
    </div>
  );
}
