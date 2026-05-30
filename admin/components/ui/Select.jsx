import clsx from "clsx";

export default function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        "w-full rounded-[6px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-sm transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

