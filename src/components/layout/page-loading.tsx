import { LinkrossLoadingMark } from "@/components/layout/linkross-loading-mark";

export function PageLoading({ message = "화면을 불러오는 중입니다" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <LinkrossLoadingMark className="size-12 animate-lk-mark-flow" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-app-foreground">{message}</p>
        <p className="text-xs text-app-muted">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}
