export default function LoadingSpinner({ label = "Loading", size = "md" }) {
  const spinnerSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className="inline-flex items-center gap-2 text-textMuted" role="status" aria-live="polite">
      <span
        className={`${spinnerSize} inline-block animate-spin rounded-full border-2 border-textMuted border-t-accent`}
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
