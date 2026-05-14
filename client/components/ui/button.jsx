import clsx from "clsx";

export default function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition duration-150 shadow-[4px_4px_0_0_rgba(31,26,23,0.14)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0_0_rgba(31,26,23,0.14)]",
        variant === "primary" &&
          "border-slate-900 bg-accent text-slate-950 hover:bg-accentSoft disabled:bg-[#d7defd] disabled:text-slate-600",
        variant === "secondary" &&
          "border-slate-900 bg-panel text-textPrimary hover:bg-panelSoft",
        variant === "ghost" && "border-transparent bg-transparent text-textMuted shadow-none hover:text-textPrimary hover:bg-transparent",
        className
      )}
      {...props}
    />
  );
}
