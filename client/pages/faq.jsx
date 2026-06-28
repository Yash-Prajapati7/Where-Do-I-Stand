import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

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
      answer: "Candidates can have the following statuses: Next Round (passed), Ongoing (being evaluated), Up Next (interview scheduled), Awaiting Results (awaiting round scores), Rejected (not selected), On Hold (pending), or Not Started (evaluation not begun).",
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
          <Menu className="w-5 h-5 text-black" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mx-auto max-w-3xl px-4 py-16 md:py-20"
      >
        <div className="glass-panel rounded-lg p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="soft-pill px-2.5 py-1 rounded">FAQ</span>
            <span className="rounded border border-border bg-muted px-2.5 py-1">
              Common questions
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">Frequently Asked Questions</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Everything you need to know about tracking your stands.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-[6px] border border-border bg-card shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-muted/40"
                >
                  <span>{faq.question}</span>
                  <span className={`text-muted-foreground text-xs transition-transform duration-150 ${openIndex === index ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border px-4 py-3 text-xs text-muted-foreground leading-relaxed bg-muted/10"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-[6px] border border-border bg-muted/15 p-5">
            <p className="text-center text-xs text-muted-foreground">
              <strong>Need help?</strong> Reach out directly to your placement committee or recruitment lead for queries.
            </p>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <Link href="/" className="inline-flex items-center justify-center rounded-[6px] border border-black bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-900 transition-colors shadow-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
