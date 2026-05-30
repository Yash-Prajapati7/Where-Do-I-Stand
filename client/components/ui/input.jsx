import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "focus-ring w-full rounded-[6px] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground",
        className
      )}
      {...props}
    />
  );
});

export default Input;

