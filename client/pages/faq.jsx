import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is WDIS?",
      answer: "WDIS (Where Do I Stand?) is a real-time placement interview tracking platform that helps students and recruitment teams monitor progress through recruitment drives with live updates on candidate status at each stage.",
    },
    {
      question: "How do I access my process board?",
      answer: "Go to the home page and enter your company or recruitment process name. If the process exists, you'll be redirected to the live Kanban board showing all stages and candidates.",
    },
    {
      question: "What are the different candidate statuses?",
      answer: "Candidates can have the following statuses: Qualified (passed), In Progress (being evaluated), Scheduled (interview scheduled), Rejected (not selected), On Hold (pending), or Not Started (evaluation not begun).",
    },
    {
      question: "Can I search for a specific candidate?",
      answer: "Yes. Use the search icon and enter your SAP ID to view your cards.",
    },
    {
      question: "What are filters for?",
      answer: "Filters allow you to narrow down the board to show only specific rounds or candidate statuses. You can combine multiple filters to get exactly the view you need.",
    },
    {
      question: "How often is the data updated?",
      answer: "WDIS updates automatically as results are published.",
    },
    {
      question: "Is WDIS mobile-friendly?",
      answer: "Yes! WDIS is fully responsive and works smoothly on desktop, tablet, and mobile devices. The mobile view adapts the board for smaller screens.",
    },
    {
      question: "Can I track multiple recruitment processes?",
      answer: "Absolutely! WDIS supports tracking multiple processes simultaneously. Recent processes are saved, so you can quickly switch between them.",
    },
    {
      question: "Do I need to create an account?",
      answer: "No account is required! Simply enter the process name on the home page, and you'll have instant access to the live board.",
    },
    {
      question: "What if I enter a process name that doesn't exist?",
      answer: "You'll see a message that the process doesn't exist. Double-check the process name or ask your placement committee for the exact name.",
    },
    {
      question: "Can I export reports from WDIS?",
      answer: "The current version provides live dashboards. Contact your administrator if you need data exports or custom reports.",
    },
    {
      question: "How is my data secured?",
      answer: "WDIS runs on a secure server. Data is accessed through standard HTTP protocols, and sensitive information is handled securely by your institution.",
    },
    {
      question: "Who manages the data on WDIS?",
      answer: "Your placement committee or recruitment team manages the candidate data. They upload and update information as interviews progress.",
    },
    {
      question: "What if I encounter a bug or have feedback?",
      answer: "Please contact your placement coordinator or the technical team managing WDIS. We appreciate feedback to improve the platform!",
    },
  ];

  return (
    <main className="page-shell min-h-screen text-textPrimary">
      <div className="landing-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-[#ffd9c8]/35 blur-3xl" />
        <div className="absolute right-[-4%] top-[8%] h-80 w-80 rounded-full bg-[#c5dbff]/35 blur-3xl" />
      </div>

      {/* Floating task bar */}
      <div className="taskbar">
        <div className="hidden sm:flex gap-2">
          <Link href="/" className="task-btn">Home</Link>
          <Link href="/about" className="task-btn">About</Link>
        </div>
        <button
          className="sm:hidden hamburger"
          aria-label="Open menu"
          onClick={() => alert("Menu: Home, About")}
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
        className="relative z-10 mx-auto max-w-4xl px-6 py-20 md:py-24"
      >
        <div className="glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">
            <span className="soft-pill rounded-full px-3 py-1">FAQ</span>
            <span className="rounded-full border border-slate-900 bg-panel px-3 py-1 text-textPrimary shadow-[3px_3px_0_0_rgba(31,26,23,0.12)]">
              Common questions
            </span>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">Frequently Asked Questions</h1>
            <p className="mt-4 text-lg text-textMuted md:text-xl">
              Everything you need to know about WDIS and how to use it.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="overflow-hidden rounded-[1.25rem] border-2 border-slate-900 bg-panel shadow-[4px_4px_0_0_rgba(31,26,23,0.12)]"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-lg font-bold text-textPrimary transition hover:bg-panelSoft"
                >
                  <span>{faq.question}</span>
                  <span className={`text-accent text-2xl transition-transform ${openIndex === index ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-900/10 px-5 py-4 text-textMuted leading-relaxed"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 rounded-[1.5rem] border border-slate-900/15 bg-[#eef4ff] p-6 shadow-[4px_4px_0_0_rgba(31,26,23,0.1)]">
            <p className="text-center text-textPrimary">
              <strong>Didn't find your answer?</strong> Reach out to your placement committee or technical team for assistance.
            </p>
          </div>

          <div className="mt-12 border-t border-slate-900/15 pt-8">
            <Link href="/" className="inline-flex items-center rounded-full border-2 border-slate-900 bg-accent px-6 py-3 font-bold text-slate-950 shadow-[4px_4px_0_0_rgba(31,26,23,0.14)] transition hover:bg-accentSoft">
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
