import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MarketingLayout } from "@/layouts/MarketingLayout";

const FAQ_ITEMS = [
  {
    question: "How does clocking in and out work?",
    answer:
      "From your dashboard, tap Clock In to start your shift and Clock Out when you're done. Your worked time is tracked automatically in between, including any breaks you take.",
  },
  {
    question: "What happens if I forget to clock out?",
    answer:
      "Shifts left open too long close automatically. When that happens, you'll be asked for the real clock-out time the next time you sign in, so your hours stay accurate before you can clock in again.",
  },
  {
    question: "How are breaks tracked?",
    answer:
      "Start a break from your dashboard when you step away, and end it when you're back. Break time is subtracted from your worked hours automatically — no manual math required.",
  },
  {
    question: "Can I fix a mistake on a past shift?",
    answer:
      "Yes. You can submit a correction request with the actual clock-out time and a short reason. Your admin reviews and approves or rejects it before it's applied.",
  },
  {
    question: "What can my manager or admin see?",
    answer:
      "Admins can view shift activity for every employee, review and approve correction requests, and export individual employee records for payroll or reporting.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your account is protected by a password you control, and email verification confirms it's really you before your account can be used.",
  },
  {
    question: "I forgot my password — what do I do?",
    answer:
      'Use the "Forgot password?" link on the log in page to receive a reset link by email, then choose a new password.',
  },
  {
    question: "Do I need to verify my email before I can log in?",
    answer:
      "Yes. After registering, check your inbox for a verification link. If it expired or never arrived, you can request a new one from the log in page.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-card">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-ink">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-soft transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? (
        <p className="px-5 pb-4 text-sm text-ink-soft">{answer}</p>
      ) : null}
    </div>
  );
}

export function FAQ() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Everything you need to know about tracking your shifts with
            TimeTrack.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
