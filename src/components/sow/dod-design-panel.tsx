"use client";

import { useState } from "react";
import { CheckCircle2, Eye, Loader2 } from "lucide-react";

import { LinkrossLoadingMark } from "@/components/layout/linkross-loading-mark";
import type { DodVerificationDesign } from "@/lib/backend";

/**
 * 한 DoD의 검수 설계 상태와, 그 상태에서 사용자가 할 수 있는 단 하나의 행동을 보여준다.
 *
 * 질문은 최초 분석에서 확정된 세트를 한 화면에 모두 펼쳐 한 번에 받는다. 한
 * 질문씩 주고받으면 사용자는 같은 DoD로 반복해서 돌아오게 된다.
 */

/**
 * 완료조건별 질의응답 화면을 켤지 여부.
 *
 * 지금은 끈다. 시연에서 쓰는 SOW는 프리셋으로 들어오고, 프리셋은 질문 없이
 * 검수 계약까지 확정된 상태로 오기 때문에 물어볼 것이 없다. 완료조건 수만큼
 * 답을 받고 그때마다 LLM을 다시 부르는 흐름은 대기 시간과 토큰만 쓴다.
 *
 * 화면만 감추고 상태·저장·답변 반영 경로는 그대로 둔다. 프리셋이 없는 원문에서
 * 질문이 다시 필요해지면 이 값만 true로 바꾸면 된다.
 */
const SHOW_CLARIFICATION_QUESTIONS: boolean = false;

type StatusTone = "ready" | "pending" | "review" | "working" | "idle";

const STATUS_TONES: Record<StatusTone, string> = {
  ready: "text-emerald-700",
  pending: "text-brand-700",
  review: "text-amber-700",
  working: "text-cyan-700",
  idle: "text-app-muted",
};

function describeStatus(
  design: DodVerificationDesign | undefined,
  isDesigningVerification: boolean,
): { tone: StatusTone; label: string; isWorking: boolean } {
  switch (design?.status) {
    case "automation_ready":
      return { tone: "ready", label: "자동 테스트 준비 완료", isWorking: false };
    case "human_review_required":
      return design.humanReviewAccepted
        ? { tone: "ready", label: "직접 확인 항목으로 확정", isWorking: false }
        : { tone: "review", label: "직접 확인 필요", isWorking: false };
    case "clarification_required":
      return { tone: "pending", label: "답변 필요", isWorking: false };
    // 질문은 끝났지만 실행 스펙이 아직 없는 과도기다. 완료로 보이면 안 된다.
    case "contract_ready":
    case "dod_ready":
      return { tone: "working", label: "실행 스펙 생성 중", isWorking: true };
    default:
      return isDesigningVerification
        ? { tone: "working", label: "AI 분석 중", isWorking: true }
        : { tone: "idle", label: "AI 분석 전", isWorking: false };
  }
}

export function DodDesignPanel({
  design,
  dialogueKey,
  isAnswering,
  isValidating,
  isDesigningVerification,
  onSubmitAnswers,
  onAcceptHumanReview,
}: {
  design: DodVerificationDesign | undefined;
  dialogueKey: string;
  isAnswering: boolean;
  isValidating: boolean;
  isDesigningVerification: boolean;
  onSubmitAnswers?: (answers: Record<string, string>) => Promise<boolean>;
  onAcceptHumanReview?: () => Promise<boolean>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const status = describeStatus(design, isDesigningVerification);
  const requirements = design?.requirements ?? [];
  const isBusy = isAnswering || isValidating;

  const answerFor = (key: string) => answers[key] ?? requirements.find((item) => item.key === key)?.answer ?? "";
  const allAnswered = requirements.length > 0 && requirements.every((item) => answerFor(item.key).trim());

  const submit = () => {
    if (!onSubmitAnswers || !allAnswered || isBusy) return;
    const payload = Object.fromEntries(requirements.map((item) => [item.key, answerFor(item.key).trim()]));
    void onSubmitAnswers(payload);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-bold text-app-muted">AI DoD 분석</span>
        <span className={`text-[0.7rem] font-bold ${STATUS_TONES[status.tone]}`}>
          {status.isWorking ? (
            <span className="inline-flex items-center gap-1.5">
              <LinkrossLoadingMark className="size-3.5 animate-lk-mark-flow" />
              {status.label}
            </span>
          ) : (
            status.label
          )}
        </span>
      </div>

      {design?.message ? (
        <p className="mt-1.5 whitespace-pre-line text-[0.7rem] leading-5 text-app-muted">{design.message}</p>
      ) : null}

      {SHOW_CLARIFICATION_QUESTIONS && design?.status === "clarification_required" && requirements.length > 0 ? (
        <div className="mt-2 space-y-3 rounded-control border border-brand-200 bg-brand-50/60 p-2.5">
          <p className="text-[0.7rem] font-semibold text-brand-800">
            자동 테스트를 만들기 위한 확인 {requirements.length}개 · 한 번에 답하면 끝납니다
          </p>
          {requirements.map((requirement, index) => {
            const inputId = `${dialogueKey}-${requirement.key}`;
            const current = answerFor(requirement.key);
            return (
              <div key={requirement.key} className="space-y-1.5">
                <label htmlFor={inputId} className="block text-[0.7rem] leading-5 text-app-foreground">
                  {index + 1}. {requirement.question}
                </label>
                {requirement.suggestions?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {requirement.suggestions.map((suggestion) => {
                      const isRecommended = suggestion === requirement.recommendedSuggestion;
                      const isChosen = current.trim() === suggestion.trim();
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            setAnswers((previous) => ({ ...previous, [requirement.key]: suggestion }))
                          }
                          className={`rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors disabled:opacity-40 ${
                            isChosen
                              ? "border-app-foreground bg-app-foreground text-white"
                              : isRecommended
                                ? "border-brand-400 bg-white text-brand-800"
                                : "border-brand-200 bg-white text-brand-800 hover:border-brand-400"
                          }`}
                        >
                          {suggestion}
                          {isRecommended && !isChosen ? " · 추천" : ""}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <input
                  id={inputId}
                  type="text"
                  value={current}
                  disabled={isBusy}
                  placeholder="직접 입력할 수도 있습니다"
                  onChange={(event) =>
                    setAnswers((previous) => ({ ...previous, [requirement.key]: event.target.value }))
                  }
                  className="min-h-9 w-full rounded-control border border-brand-200 bg-white px-3 text-xs text-app-foreground outline-none focus:border-brand-500 disabled:opacity-60"
                />
              </div>
            );
          })}
          <button
            type="button"
            disabled={!allAnswered || isBusy || !onSubmitAnswers}
            onClick={submit}
            className="primary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control px-3 text-[0.7rem] font-semibold disabled:opacity-40"
          >
            {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            {isAnswering
              ? "답변을 반영하는 중"
              : isValidating
                ? "자동 테스트를 만드는 중"
                : `답변 ${requirements.length}개 확정`}
          </button>
          {!allAnswered ? (
            <p className="text-[0.7rem] text-brand-700">모든 항목에 답하면 확정할 수 있습니다.</p>
          ) : null}
        </div>
      ) : null}

      {design?.status === "human_review_required" ? (
        <div className="mt-2 space-y-2 rounded-control border border-amber-200 bg-amber-50/60 p-2.5">
          {design.humanReviewAccepted ? (
            <p className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              검수 때 발주자가 Preview에서 직접 확인합니다.
            </p>
          ) : (
            <>
              <p className="text-[0.7rem] leading-5 text-amber-900">
                이 조건은 자동 테스트로 판정할 수 없습니다. 발주자가 직접 확인하는 항목으로 확정하면 검토 요청을
                진행할 수 있습니다. 자동 통과로 처리되지 않습니다.
              </p>
              <button
                type="button"
                disabled={isBusy || !onAcceptHumanReview}
                onClick={() => void onAcceptHumanReview?.()}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-amber-400 bg-white px-3 text-[0.7rem] font-semibold text-amber-900 disabled:opacity-40"
              >
                {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                직접 확인 항목으로 확정
              </button>
            </>
          )}
        </div>
      ) : null}

      {design?.status === "automation_ready" && design.testHint ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-[0.7rem] font-semibold text-app-muted">
            실행될 테스트 내용 보기
          </summary>
          <p className="mt-1 whitespace-pre-line break-words text-[0.7rem] leading-5 text-app-muted">
            {design.testHint}
          </p>
        </details>
      ) : null}
    </div>
  );
}
