import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 shadow-[0_4px_12px_-2px_rgba(16,24,40,0.08)]">
        <Link
          to="/"
          aria-label="Back to home"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="mb-6 text-center">
          <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
