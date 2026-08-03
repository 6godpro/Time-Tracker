import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items =
    user?.role === "ADMIN"
      ? [...navItems, { to: "/admin", label: "Admin" }]
      : navItems;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-display text-lg font-bold text-ink">
            TimeTracker
          </span>
          <div className="flex items-center gap-8">
            <nav className="hidden gap-1 sm:flex">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.to
                      ? "bg-status-idle-bg text-ink"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ProfileMenu />
            </div>
          </div>
        </div>
        <nav className="flex gap-1 border-t border-line px-4 py-2 sm:hidden">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors ${
                pathname === item.to
                  ? "bg-status-idle-bg text-ink"
                  : "text-ink-soft"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
