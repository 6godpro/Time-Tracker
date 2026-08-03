import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { getInitials } from "@/utils/user";
import { useNavigate } from "@tanstack/react-router";
import { Settings, User2 } from "lucide-react";

export function ProfileMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const initials = getInitials(user.firstName, user.lastName);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Profile menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-50 rounded-xl border border-line bg-card p-1 shadow-[0_4px_12px_-2px_rgba(16,24,40,0.12)]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-ink-soft">{user.jobTitle}</p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item
            onSelect={() => navigate({ to: "/profile" })}
            className="flex items-center gap-1 cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-ink outline-none data-highlighted:bg-surface"
          >
            <User2 size={16} /> View Profile
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => navigate({ to: "/settings" })}
            className="flex items-center gap-1 cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-ink outline-none data-highlighted:bg-surface"
          >
            <Settings size={16} /> Settings
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item
            onSelect={() => logout()}
            className="cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-danger outline-none data-highlighted:bg-danger-bg"
          >
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
