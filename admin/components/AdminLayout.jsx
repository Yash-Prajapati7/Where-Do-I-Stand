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
    <main className="admin-shell">
      <header className="hero-card">
        <p className="eyebrow">Where Do I Stand</p>
        <h1>{title || "Placement Admin Panel"}</h1>
        <p>
          {description ||
            "Follow the step-based flow to set up processes, import students, manage rounds, and update candidate progress."}
        </p>
      </header>

      <nav className="step-nav" aria-label="Admin steps">
        {steps.map((step) => {
          const isActive = router.pathname === step.href;
          const isDisabled = step.requiresProcess && !processReady;

          if (isDisabled) {
            return (
              <span
                key={step.href}
                className={clsx("step-link", "disabled")}
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
              className={clsx("step-link", isActive && "active")}
              aria-current={isActive ? "page" : undefined}
            >
              {step.label}
            </Link>
          );
        })}

        <div className="step-spacer" aria-hidden="true" />

        <div className={clsx("process-chip", !selectedProcessLabel && "muted")}>
          <span className="process-chip-label">Selected</span>
          <span className="process-chip-value">{selectedProcessLabel || "None"}</span>
        </div>
      </nav>

      {children}
    </main>
  );
}
