"use client";

import { useEffect } from "react";

import { markNotificationsRead } from "@/components/notifications/notification-read-state";

type NotificationReadMarkerProps = {
  notificationIds: string[];
  workspace: "company" | "freelancer";
};

export function NotificationReadMarker({
  notificationIds,
  workspace,
}: NotificationReadMarkerProps) {
  useEffect(() => {
    markNotificationsRead(workspace, notificationIds);
  }, [notificationIds, workspace]);

  return null;
}
