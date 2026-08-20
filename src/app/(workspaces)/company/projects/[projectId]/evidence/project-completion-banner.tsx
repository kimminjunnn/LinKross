"use client";

import { useState, useTransition } from "react";
import { Loader2, PartyPopper } from "lucide-react";

import { completeProjectAction } from "@/app/actions/finance";

export function ProjectCompletionBanner({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-card border border-accent-200 bg-accent-50 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm font-semibold text-accent-800">
        <PartyPopper className="size-5 shrink-0" />
        프로젝트 정산이 모두 완료되었습니다. 프로젝트를 끝낼까요?
      </p>
      <div className="flex items-center gap-3">
        {message && <p className="text-xs text-accent-700">{message}</p>}
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const result = await completeProjectAction(projectId);
            setMessage(result.ok ? "프로젝트를 완료 처리했습니다." : result.error.message);
          })}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-accent-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <PartyPopper className="size-4" />}
          프로젝트 끝내기
        </button>
      </div>
    </div>
  );
}
