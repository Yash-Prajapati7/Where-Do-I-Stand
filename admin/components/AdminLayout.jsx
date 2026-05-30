import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";

const steps = [
  { href: "/", label: "1. Process", requiresProcess: false },
  { href: "/students", label: "2. Students", requiresProcess: true },
  { href: "/rounds", label: "3. Rounds", requiresProcess: true },
  { href: "/progress", label: "4. Progress", requiresProcess: true },
];

export default function AdminLayout({
  children,
  title,
  description,
  processReady = false,
  selectedProcessLabel = "",
}) {
  const router = useRouter();

  return (
    <main className="admin-shell font-sans text-neutral-900 bg-background min-h-screen">
      <header className="mb-6 flex flex-col gap-1.5 border-b border-neutral-100 pb-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-semibold">Where Do I Stand</p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{title || "Placement Admin Panel"}</h1>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
          {description ||
            "Follow the step-based flow to set up processes, import students, manage rounds, and update candidate progress."}
        </p>
      </header>

      <nav className="step-nav" aria-label="Admin steps">
        <div className="step-nav-items">
          {steps.map((step) => {
            const isActive = router.pathname === step.href;
            const isDisabled = step.requiresProcess && !processReady;

            if (isDisabled) {
              return (
                <span
                  key={step.href}
                  className={clsx("step-link disabled")}
                  aria-disabled="true"
                >
                  {step.label}
                </span>
              );
            }

            return (
              <Link
                key={step.href}
                href={step.href}
                className={clsx(
                  "step-link",
                  isActive && "active"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {step.label}
              </Link>
            );
          })}
        </div>

        <div className={clsx("process-chip", !selectedProcessLabel && "opacity-50")}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Process</span>
          <span className="font-semibold text-neutral-800">{selectedProcessLabel || "None Selected"}</span>
        </div>
      </nav>

      {children}
    </main>
  );
}

