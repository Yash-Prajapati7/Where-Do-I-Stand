import Link from "next/link";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="page-shell min-h-screen text-textPrimary">
      <div className="landing-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-[#ffd9c8]/35 blur-3xl" />
        <div className="absolute right-[-4%] top-[8%] h-80 w-80 rounded-full bg-[#c5dbff]/35 blur-3xl" />
      </div>

      {/* Floating task bar (About / FAQ) */}
      <div className="taskbar">
        <div className="hidden sm:flex gap-2">
          <Link href="/" className="task-btn">Home</Link>
          <Link href="/faq" className="task-btn">FAQ</Link>
        </div>
        <button
          className="sm:hidden hamburger"
          aria-label="Open menu"
          onClick={() => alert("Menu: Home, FAQ")}
        >
          <Menu className="w-5 h-5 text-black" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mx-auto max-w-4xl px-4 py-16 md:py-20"
      >
        <div className="glass-panel rounded-lg p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="soft-pill px-2.5 py-1 rounded">About WDIS</span>
            <span className="rounded border border-border bg-muted px-2.5 py-1">
              Student-facing transparency
            </span>
          </div>

          <div className="mb-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">About WDIS</h1>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                Where Do I Stand? An open placement tracking platform engineered to offer students absolute transparency across recruitment stages.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-xs">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Intended Audience</p>
              <div className="mt-3 space-y-1.5 text-xs text-foreground font-medium">
                <p>&bull; Academic Placement Commitee</p>
                <p>&bull; Recruitment Coordinators</p>
                <p>&bull; Students Tracking Stands</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 text-sm leading-relaxed">
            <section className="panel">
              <h2 className="text-base font-bold text-foreground">Our Mission</h2>
              <p className="mt-2 text-muted-foreground">
                WDIS eliminates anxiety in college placement rounds. We provide a single, reliable public board so candidates can view their standing instantly.
              </p>
            </section>

            <section className="panel">
              <h2 className="text-base font-bold text-foreground">Aesthetic Execution</h2>
              <p className="mt-2 text-muted-foreground">
                Built with a high-fidelity academic layout, this dashboard connects to a MongoDB database to aggregate and serve live candidate statuses.
              </p>
            </section>

            <section className="panel">
              <h2 className="text-base font-bold text-foreground">Core Functions</h2>
              <ul className="mt-3 grid gap-2">
                <li className="rounded-[6px] border border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground"><strong>Live Kanban Board:</strong> High-performance cards representing stage pipelines.</li>
                <li className="rounded-[6px] border border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground"><strong>SAP ID Search:</strong> Secure, localized matching for individual privacy.</li>
                <li className="rounded-[6px] border border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground"><strong>Orderly Timelines:</strong> Structured progression records indexed by arrival times.</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Link href="/" className="inline-flex items-center justify-center rounded-[6px] border border-black bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-900 transition-colors shadow-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>

    </main>
  );
}
