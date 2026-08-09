import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { formatDate, formatTime } from "@/utils/format";
import type { Notification } from "@/types/notification";

function notificationDestination(notification: Notification) {
  if (notification.type === "PAYROLL_PAYMENT_RECORDED" && notification.payrollPaymentId) {
    return { to: "/history" as const, search: { tab: "payroll" as const, paymentId: notification.payrollPaymentId } };
  }

  if (
    (notification.type === "SHIFT_EDIT_REQUEST_APPROVED" || notification.type === "SHIFT_EDIT_REQUEST_REJECTED") &&
    notification.shiftEditRequestId
  ) {
    return {
      to: "/history" as const,
      search: { tab: "shifts" as const, shiftEditRequestId: notification.shiftEditRequestId },
    };
  }

  if (notification.type === "SHIFT_EDIT_REQUEST_SUBMITTED") {
    return { to: "/admin" as const };
  }

  return null;
}

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const destination = notificationDestination(notification)

  return (
    <DropdownMenu.Item
      onSelect={(event) => {
        if (!notification.read) {
          markRead.mutate(notification.id);
        }
        if (destination) {
          navigate(destination);
        } else {
          event.preventDefault();
        }
      }}
      className={`flex cursor-pointer select-none flex-col gap-0.5 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-surface ${
        notification.read ? "text-ink-soft" : "text-ink"
      }`}
    >
      <div className="flex items-start gap-2">
        {!notification.read ? (
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
        ) : null}
        <p className={notification.read ? "" : "font-medium"}>
          {notification.message}
        </p>
      </div>
      <p className="pl-3.5 text-xs text-ink-soft">
        {formatDate(notification.createdAt)},{" "}
        {formatTime(notification.createdAt)}
      </p>
    </DropdownMenu.Item>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: notifications, isLoading } = useNotifications(isOpen);
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = !!unreadCount && unreadCount > 0;

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Bell size={18} />
          {hasUnread ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
    {unreadCount < 9 ? unreadCount : "9+"}
  </span>
          ) : null}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-line bg-card p-1 shadow-[0_4px_12px_-2px_rgba(16,24,40,0.12)]"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {hasUnread ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-brand hover:text-brand-dark"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-3 py-4 text-center text-sm text-ink-soft">
                Loading&hellip;
              </p>
            ) : !notifications || notifications.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-ink-soft">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
