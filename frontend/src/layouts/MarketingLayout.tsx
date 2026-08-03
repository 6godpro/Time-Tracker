import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";

export function MarketingLayout({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-40 w-full border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-lg font-bold text-ink">
            TimeTracker
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              hash="features"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              Features
            </Link>
            <Link
              to="/"
              hash="how-it-works"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              How It Works
            </Link>
            <Link
              to="/faq"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {token ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:inline-block"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark"
                >
                  Get Started
                </Link>
                <ThemeToggle />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link to="/" className="font-display text-sm font-bold text-ink">
              TimeTracker
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link
                to="/"
                hash="features"
                className="text-sm text-ink-soft hover:text-ink"
              >
                Features
              </Link>
              <Link
                to="/"
                hash="how-it-works"
                className="text-sm text-ink-soft hover:text-ink"
              >
                How It Works
              </Link>
              <Link to="/faq" className="text-sm text-ink-soft hover:text-ink">
                FAQ
              </Link>
              <Link
                to="/login"
                className="text-sm text-ink-soft hover:text-ink"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm text-ink-soft hover:text-ink"
              >
                Register
              </Link>
            </nav>
          </div>
          <p className="mt-6 text-center text-xs text-ink-soft sm:text-left">
            &copy; {new Date().getFullYear()} TimeTracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
