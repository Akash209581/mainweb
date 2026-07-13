"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser } from "@/lib/auth/client";
import { Bell, Check, Sparkles } from "lucide-react";
import { markNotificationReadAction } from "@/actions/notification.actions";

interface NotificationItem {
  id: string;
  subject: string;
  body: string;
}

export function NotificationBell() {
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const eventSource = new EventSource(`/ICGIT/hanvo/notifications?clerkId=${user.id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setUnreadCount(data.count ?? 0);
        setNotifications(data.notifications ?? []);
      } catch (err) {
        // ignore parsing err
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user, isLoaded]);

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      try {
        const res = await markNotificationReadAction(id);
        if (res.ok) {
          setNotifications(prev => prev.filter(n => n.id !== id));
          setUnreadCount(prev => Math.max(prev - 1, 0));
        }
      } catch (err) {
        // ignore
      }
    });
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus-ring relative inline-flex size-10 items-center justify-center rounded-lg border border-border/40 bg-surface/60 text-muted hover:text-foreground transition"
        aria-label="Notification alerts"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-soft">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-border/30 bg-background/95 p-4 shadow-2xl backdrop-blur-2xl z-50 text-xs">
          <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-3">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-accent animate-pulse" /> Notifications
            </span>
            <span className="text-[10px] text-muted font-semibold">{unreadCount} Unread</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-center py-4 text-muted italic">No new notifications.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="rounded-lg border border-border/20 bg-surface/30 p-2.5 flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-foreground">{n.subject}</h5>
                    <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="focus-ring rounded p-1 hover:bg-hover/10 text-accent transition"
                    title="Mark as read"
                  >
                    <Check className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
