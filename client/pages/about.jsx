import Link from "next/link";
import { motion } from "framer-motion";

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
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="18" height="2" fill="#000" />
            <rect y="5" width="18" height="2" fill="#000" />
            <rect y="10" width="18" height="2" fill="#000" />
          </svg>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:py-24"
      >
        <div className="glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">
            <span className="soft-pill rounded-full px-3 py-1">About WDIS</span>
            <span className="rounded-full border border-slate-900 bg-panel px-3 py-1 text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.12)]">
              Student-facing transparency
            </span>
          </div>

          <div className="mb-12 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
            <div>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">About WDIS</h1>
              <p className="mt-4 text-lg text-textMuted md:text-xl">
                Where Do I Stand? The placement interview tracking platform built to give students clearer progress visibility.
              </p>
            </div>

            <div className="rounded-[1.5rem] border-2 border-slate-900 bg-panel p-4 shadow-[6px_6px_0_0_rgba(31,26,23,0.14)] md:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">Designed for</p>
              <div className="mt-3 space-y-2 text-sm text-textPrimary">
                <p>Placement committees</p>
                <p>Recruitment coordinators</p>
                <p>Students tracking their standing</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 text-base leading-relaxed md:text-lg">
            <section className="panel">
              <h2 className="text-2xl font-bold text-textPrimary">Our Mission</h2>
              <p className="mt-3 text-textMuted">
                WDIS is built to give students real-time visibility into their placement interview journey.
              </p>
            </section>

            <section className="panel">
              <h2 className="text-2xl font-bold text-textPrimary">What We Do</h2>
              <p className="mt-3 text-textMuted">
                We provide a live dashboard that tracks progress across multiple rounds of interviews, from group discussions to technical and HR stages.
              </p>
            </section>

            <section className="panel">
              <h2 className="text-2xl font-bold text-textPrimary">Key Features</h2>
              <ul className="mt-4 grid gap-3">
                <li className="rounded-2xl border border-slate-900/15 bg-canvas-soft px-4 py-3 shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"><strong>Live Kanban Board:</strong> See candidates move through each stage.</li>
                <li className="rounded-2xl border border-slate-900/15 bg-canvas-soft px-4 py-3 shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"><strong>Process Management:</strong> Track multiple recruitment drives simultaneously.</li>
                <li className="rounded-2xl border border-slate-900/15 bg-canvas-soft px-4 py-3 shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"><strong>Status Tracking:</strong> Know where each candidate stands at a glance.</li>
                <li className="rounded-2xl border border-slate-900/15 bg-canvas-soft px-4 py-3 shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"><strong>SAP ID Search & Filters:</strong> Focus on a single candidate or a specific round.</li>
                <li className="rounded-2xl border border-slate-900/15 bg-canvas-soft px-4 py-3 shadow-[3px_3px_0_0_rgba(31,26,23,0.08)]"><strong>Responsive Design:</strong> Works cleanly across desktop and mobile.</li>
              </ul>
            </section>

            <section className="panel">
              <h2 className="text-2xl font-bold text-textPrimary">How It Works</h2>
              <ol className="mt-4 grid gap-3 list-decimal pl-5 text-textMuted">
                <li><strong>Select a Process:</strong> Enter the company or recruitment process name on the home page.</li>
                <li><strong>View Your Board:</strong> The Kanban board loads the configured rounds and candidates.</li>
                <li><strong>Track Progress:</strong> Follow each candidate as statuses change.</li>
                <li><strong>Stay Informed:</strong> Updates appear as the process evolves.</li>
              </ol>
            </section>

            <section className="panel">
              <h2 className="text-2xl font-bold text-textPrimary">Why WDIS Matters</h2>
              <p className="mt-3 text-textMuted">
                Recruitment stress is real. WDIS reduces guesswork with a simple, transparent interface that helps everyone stay aligned.
              </p>
            </section>

            <section className="panel">
              <h2 className="text-2xl font-bold text-textPrimary">Get Started</h2>
              <p className="mt-3 text-textMuted">
                Head back to the home page, enter a process name, and start tracking the journey.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-900/15">
            <Link href="/" className="inline-flex items-center rounded-full border-2 border-slate-900 bg-accent px-6 py-3 font-bold text-slate-950 shadow-[4px_4px_0_0_rgba(31,26,23,0.14)] transition hover:bg-accentSoft">
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
