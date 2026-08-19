"use client";

import { useState, useTransition } from "react";
import { FileArchive, Loader2 } from "lucide-react";

import { generateEvidenceBundleAction } from "@/app/actions/finance";

export function GenerateEvidenceBundleButton({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const result = await generateEvidenceBundleAction(projectId);
          setMessage(result.ok ? `v${result.data.versionNumber} 번들을 생성했습니다.` : result.error.message);
        })}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-black text-white disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <FileArchive className="size-4" />}
        통합 증빙 번들 생성
      </button>
      {message && <p className="mt-2 text-sm font-bold text-app-muted">{message}</p>}
    </div>
  );
}
