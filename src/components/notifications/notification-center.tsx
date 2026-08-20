import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Handshake,
  Receipt,
} from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { NotificationReadMarker } from "@/components/notifications/notification-read-marker";
import type { BackendResult, WorkspaceNotification } from "@/lib/backend";

type NotificationCenterProps = {
  result: BackendResult<WorkspaceNotification[]>;
  workspace: "company" | "freelancer";
};

const companyCopy = {
  eyebrow: "Workspace",
  title: "알림",
  description: "선정, 업무명세서 승인, 수정본 승인 요청처럼 다음 행동이 필요한 흐름을 확인합니다.",
  emptyTitle: "새 알림이 없습니다",
  emptyDescription: "프리랜서 승인이나 업무명세서 상태 변경이 생기면 이곳에 표시됩니다.",
  actionBadge: "확인 필요",
  recordBadge: "기록",
  openLabel: "이동",
};

const freelancerCopy = {
  eyebrow: "Developer Workspace",
  title: "Notifications",
  description: "Track selections, SOW approval requests, and client approval updates in one place.",
  emptyTitle: "No notifications yet",
  emptyDescription: "Project selections and SOW review requests will appear here.",
  actionBadge: "Action needed",
  recordBadge: "Record",
  openLabel: "Open",
};

export function NotificationCenter({ result, workspace }: NotificationCenterProps) {
  const copy = workspace === "company" ? companyCopy : freelancerCopy;
  const actionNotificationIds = result.ok
    ? result.data
        .filter((notification) => notification.requiresAction)
        .map((notification) => notification.id)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl pb-16">
      <NotificationReadMarker
        notificationIds={actionNotificationIds}
        workspace={workspace}
      />

      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      {!result.ok ? (
        <div className="mt-8 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-danger">
          <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
          <p className="text-sm">{result.error.message}</p>
        </div>
      ) : result.data.length === 0 ? (
        <section className="mt-8 rounded-card border border-dashed border-app-border-strong bg-app-surface p-10 text-center">
          <Bell aria-hidden="true" className="mx-auto size-9 text-app-muted" />
          <h2 className="mt-4 text-lg font-semibold text-app-foreground">{copy.emptyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-app-muted">{copy.emptyDescription}</p>
        </section>
      ) : (
        <section className="mt-8 space-y-3">
          {result.data.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-card border p-5 shadow-card sm:p-6 ${
                notification.requiresAction
                  ? "border-[#F95803]/30 bg-[#FFF3ED]"
                  : "border-app-border bg-app-surface"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${
                      notification.requiresAction
                        ? "bg-[#F95803] text-white"
                        : "bg-app-surface-subtle text-app-muted"
                    }`}
                  >
                    {getNotificationIcon(notification.kind)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-app-foreground">
                        {notification.title}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          notification.requiresAction
                            ? "bg-[#F95803] text-white"
                            : "bg-app-surface-subtle text-app-muted"
                        }`}
                      >
                        {notification.requiresAction ? copy.actionBadge : copy.recordBadge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-app-muted">
                      {notification.projectTitle} · {formatDateTime(notification.occurredAt)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-app-muted">
                      {notification.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={notification.href}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-4 text-sm font-semibold text-app-foreground hover:bg-app-surface-subtle"
                >
                  {copy.openLabel}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function getNotificationIcon(kind: WorkspaceNotification["kind"]) {
  if (kind === "proposal_selected") {
    return <Handshake aria-hidden="true" className="size-5" />;
  }
  if (kind === "sow_approval_requested") {
    return <FileCheck2 aria-hidden="true" className="size-5" />;
  }
  if (kind === "commission_overdue") {
    return <Receipt aria-hidden="true" className="size-5" />;
  }
  return <CheckCircle2 aria-hidden="true" className="size-5" />;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
