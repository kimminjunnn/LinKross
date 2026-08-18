"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

import {
  getNotificationReadEventName,
  getUnreadNotificationIds,
} from "@/components/notifications/notification-read-state";

type NotificationBellProps = {
  actionNotificationIds: string[];
  href: string;
  workspace: "company" | "freelancer";
};

export function NotificationBell({
  actionNotificationIds,
  href,
  workspace,
}: NotificationBellProps) {
  const stableNotificationIds = useMemo(
    () => [...actionNotificationIds].sort(),
    [actionNotificationIds],
  );
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const refreshUnreadState = () => {
      setHasUnreadNotifications(
        getUnreadNotificationIds(workspace, stableNotificationIds).length > 0,
      );
    };

    refreshUnreadState();
    window.addEventListener(getNotificationReadEventName(), refreshUnreadState);
    window.addEventListener("storage", refreshUnreadState);

    return () => {
      window.removeEventListener(getNotificationReadEventName(), refreshUnreadState);
      window.removeEventListener("storage", refreshUnreadState);
    };
  }, [stableNotificationIds, workspace]);

  return (
    <Link
      href={href}
      aria-label={workspace === "freelancer" ? "Open notifications" : "알림 열기"}
      className="relative grid size-10 place-items-center rounded-control text-app-muted hover:bg-app-surface-subtle hover:text-app-foreground"
    >
      <Bell aria-hidden="true" className="size-5" />
      {hasUnreadNotifications ? (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-500 ring-2 ring-app-surface"
        />
      ) : null}
      <span className="sr-only">
        {hasUnreadNotifications
          ? workspace === "freelancer"
            ? "You have unread notifications"
            : "읽지 않은 알림이 있습니다"
          : workspace === "freelancer"
            ? "Notifications"
            : "알림"}
      </span>
    </Link>
  );
}
