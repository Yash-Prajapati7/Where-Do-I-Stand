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
        "w-fit rounded-[6px] border px-4 py-2 text-sm font-medium transition duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 select-none shadow-sm",
        variant === "primary" &&
          "border-black bg-black text-white hover:bg-neutral-900 hover:border-neutral-900",
        variant === "secondary" &&
          "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300",
        variant === "danger" &&
          "border-red-600 bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}

