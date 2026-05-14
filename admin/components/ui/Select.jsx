import clsx from "clsx";

export default function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
