"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  useNotifications,
  useSyncNotifications,
  useMarkNotification,
} from "@/hooks/use-apex";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function relativeTime(date: string) {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return "";
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "newsletter_deadline":
    case "newsletter_overdue":
    case "newsletter_published":
      return "📧";
    case "sponsor_renewal":
    case "sponsor_expired":
      return "🤝";
    case "social_publish_reminder":
    case "social_overdue":
      return "📱";
    default:
      return "🔔";
  }
}

export function NotificationsDropdown() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: syncNotifications, isPending: isSyncing } = useSyncNotifications();
  const { mutate: markNotification } = useMarkNotification();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      syncNotifications();
    }
  }, [open, syncNotifications]);

  const unread = notifications?.filter((n) => !n.read).length || 0;

  function handleOpen(notificationId: string, link?: string) {
    markNotification({ id: notificationId, patch: { read: true } });
    setOpen(false);
    if (link) router.push(link);
  }

  function handleDismiss(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation();
    markNotification({ id: notificationId, patch: { dismissed: true } });
  }

  function markAllRead(e: React.MouseEvent) {
    e.stopPropagation();
    notifications
      ?.filter((n) => !n.read)
      .forEach((n) => markNotification({ id: n.id, patch: { read: true } }));
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-transparent text-[#888888] transition-colors hover:bg-[#111111] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff1a1a]/50">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff1a1a] px-1 text-[10px] font-medium text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 border-[#222222] bg-[#0a0a0a] p-0 text-white"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#222222]">
          <DropdownMenuLabel className="text-sm font-medium text-white">
            Notifications
          </DropdownMenuLabel>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 text-xs text-[#ff1a1a] hover:text-white hover:bg-[#111111]"
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {isLoading || isSyncing ? (
            <div className="px-3 py-4 text-sm text-[#888888]">Loading...</div>
          ) : notifications?.length ? (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleOpen(n.id, n.link)}
                className="flex cursor-pointer items-start gap-3 px-3 py-3 text-sm focus:bg-[#111111]"
              >
                <span className="mt-0.5 text-base">{typeIcon(n.type)}</span>
                <div className="flex-1 space-y-0.5">
                  <p className={`text-sm ${n.read ? "text-[#888888]" : "font-medium text-white"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-[#888888] line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-[#666666]">{relativeTime(n.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotification({ id: n.id, patch: { read: true } });
                      }}
                      className="h-6 w-6 text-[#888888] hover:text-white hover:bg-[#222222]"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => handleDismiss(e, n.id)}
                    className="h-6 w-6 text-[#888888] hover:text-[#ff1a1a] hover:bg-[#222222]"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-[#888888]">No notifications yet.</div>
          )}
        </div>
        <DropdownMenuSeparator className="bg-[#222222]" />
        <DropdownMenuItem
          onClick={() => setOpen(false)}
          className="cursor-pointer justify-center text-xs text-[#888888] focus:bg-[#111111]"
        >
          Close
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
