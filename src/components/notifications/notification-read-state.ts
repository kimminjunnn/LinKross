"use client";

const notificationReadEventName = "linkross:notifications-read";

export function getNotificationReadEventName() {
  return notificationReadEventName;
}

export function getUnreadNotificationIds(workspace: string, notificationIds: string[]) {
  if (typeof window === "undefined") return notificationIds;

  const readIds = getReadNotificationIds(workspace);
  return notificationIds.filter((id) => !readIds.has(id));
}

export function markNotificationsRead(workspace: string, notificationIds: string[]) {
  if (typeof window === "undefined" || notificationIds.length === 0) return;

  const readIds = getReadNotificationIds(workspace);
  notificationIds.forEach((id) => readIds.add(id));
  window.localStorage.setItem(getStorageKey(workspace), JSON.stringify(Array.from(readIds)));
  window.dispatchEvent(new CustomEvent(notificationReadEventName, { detail: { workspace } }));
}

function getReadNotificationIds(workspace: string) {
  const raw = window.localStorage.getItem(getStorageKey(workspace));
  if (!raw) return new Set<string>();

  try {
    const values = JSON.parse(raw);
    if (!Array.isArray(values)) return new Set<string>();
    return new Set(values.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set<string>();
  }
}

function getStorageKey(workspace: string) {
  return `linkross:read-notifications:${workspace}`;
}
