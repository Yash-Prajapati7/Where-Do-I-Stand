import clsx from "clsx";

export default function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-[6px] border px-4 py-2 text-sm font-medium transition duration-150 ease-in-out shadow-sm select-none",
        variant === "primary" &&
          "border-foreground bg-foreground text-background hover:bg-foreground/95 hover:border-foreground/95 disabled:bg-foreground/30 disabled:border-transparent disabled:text-background/80",
        variant === "secondary" &&
          "border-border bg-card text-foreground hover:bg-muted hover:border-border/80",
        variant === "ghost" && 
          "border-transparent bg-transparent text-muted-foreground shadow-none hover:text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}

