import clsx from "clsx";

export default function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        "w-fit rounded-2xl border px-4 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
        variant === "secondary" &&
          "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        variant === "danger" &&
          "border-rose-600 bg-rose-600 text-white hover:bg-rose-700",
        className
      )}
      {...props}
    />
  );
}
