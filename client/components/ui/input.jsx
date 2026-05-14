import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "focus-ring w-full rounded-2xl border-2 border-slate-900 bg-panel px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted shadow-[4px_4px_0_0_rgba(31,26,23,0.10)]",
        className
      )}
      {...props}
    />
  );
});

export default Input;
