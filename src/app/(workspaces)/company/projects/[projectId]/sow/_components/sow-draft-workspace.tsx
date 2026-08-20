"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2, MessageSquareText } from "lucide-react";

const ApprovalPage = dynamic(() => import("../../approval/page"));

import { SowKoreanForm } from "@/components/sow/sow-korean-form";
import { SowEnglishPreview } from "@/components/sow/sow-english-preview";
import {
  EnglishSOWResult,
  MilestoneInput,
} from "@/lib/rag-translator";
import { analyzeWorkDetailWithLLM, generateEnglishSowWithLLM } from "@/app/actions/analyze";
import { saveSowDraftAction, submitSowForReviewAction } from "@/app/actions/sow";
import {
  ApprovalSowSnapshot,
} from "@/lib/sow-approval";
import type { SowWorkspaceContext, SowWorkspaceDraft } from "@/lib/backend";

const INITIAL_MILESTONES: MilestoneInput[] = [
  {
    id: "m-1",
    code: "M1",
    title: "",
    period: "",
    amount: "",
    dods: [""],
  },
];

export function SowWorkspace({
  context,
  isRevisionMode = false,
}: {
  context: SowWorkspaceContext;
  isRevisionMode?: boolean;
}) {
  if (context.lifecycleStage !== "preparing" && !isRevisionMode) {
    return <ApprovalPage />;
  }

  return <SowDraftWorkspace context={context} isRevisionMode={isRevisionMode} />;
}

function formatDateForForm(isoDate: string): string {
  return isoDate ? isoDate.replaceAll("-", ".") : "";
}

function formatBudgetForForm(amount: number): string {
  return amount > 0 ? amount.toLocaleString() : "";
}

function toEditableMilestones(draft: SowWorkspaceDraft | null): MilestoneInput[] {
  if (!draft?.milestones.length) return INITIAL_MILESTONES;

  return draft.milestones.map((milestone, index) => ({
    id: `m-${index + 1}`,
    code: milestone.code || `M${index + 1}`,
    title: milestone.title,
    period: milestone.period,
    amount: milestone.amount,
    dods: milestone.dods.length ? milestone.dods : [""],
  }));
}

function isEnglishSowResult(value: unknown): value is EnglishSOWResult {
  return Boolean(value) && typeof value === "object";
}

function formatRevisionRequestDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "요청 시간 확인 예정";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function SowDraftWorkspace({
  context,
  isRevisionMode,
}: {
  context: SowWorkspaceContext;
  isRevisionMode: boolean;
}) {
  const router = useRouter();
  const projectId = context.projectId;
  const revisionDraft = isRevisionMode ? context.latestSowDraft : null;

  const [workDetail, setWorkDetail] = useState(() => revisionDraft?.workDetail ?? "");
  // 공고 등록 시 입력한 일정·예산을 기본값으로 미리 채운다. 필요하면 그대로 수정할 수 있다.
  const [startDate, setStartDate] = useState(() =>
    revisionDraft?.startDate ? revisionDraft.startDate : formatDateForForm(context.startDate),
  );
  const [endDate, setEndDate] = useState(() =>
    revisionDraft?.endDate ? revisionDraft.endDate : formatDateForForm(context.endDate),
  );
  const [budget, setBudget] = useState(() =>
    revisionDraft?.budget ? revisionDraft.budget : formatBudgetForForm(context.budgetAmount),
  );
  const [milestones, setMilestones] =
    useState<MilestoneInput[]>(() => toEditableMilestones(revisionDraft));
  const [englishSow, setEnglishSow] = useState<EnglishSOWResult | null>(() =>
    isEnglishSowResult(revisionDraft?.englishSow) ? revisionDraft.englishSow : null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPane, setExpandedPane] = useState<"none" | "korean" | "english">("none");

  const handleAnalyzeAI = async (fileContent?: string) => {
    let textToAnalyze = workDetail;
    if (context.budgetAmount) {
      textToAnalyze = `예산: ${context.budgetAmount} USDC\n\n${textToAnalyze}`;
    }
    const combinedDetail = [textToAnalyze, fileContent].filter(Boolean).join("\n\n---\n\n");

    if (!combinedDetail.trim()) {
      setStatusMessage("업무 상세를 먼저 입력하거나 파일을 업로드해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage("✨ AI(LLM)가 문맥을 분석하여 최적의 마일스톤을 설계하고 있습니다...");

    try {
      const analysis = await analyzeWorkDetailWithLLM(combinedDetail, context.startDate, context.endDate);

      const cleanedMilestones = analysis.milestones.map((m) => ({
        ...m,
        dods: m.dods.map((dod) => dod.replace(/^\[.*?\]\s*/, "")),
      }));

      setMilestones(cleanedMilestones);
      setStatusMessage("✅ AI 마일스톤 분석 및 자동 할당이 완료되었습니다.");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setStatusMessage(`❌ 분석 실패: ${message}`);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // RAG 기반 영문 명세 생성 (비동기 변환)
  const handleGenerateEnglishSOW = async (hiddenFileContent?: string) => {
    let textToAnalyze = workDetail;
    if (hiddenFileContent) {
      textToAnalyze = [workDetail, hiddenFileContent].filter(Boolean).join("\n\n---\n\n");
    }

    if (!textToAnalyze.trim() && milestones.length === 0) {
      setStatusMessage("업무 상세를 먼저 입력하거나 AI 분석을 진행해 주세요.");
      return;
    }

    // date check removed since DB handles it

    const hasIncompleteMilestone =
      milestones.length === 0 ||
      milestones.some(
        (milestone) =>
          !String(milestone.title || "").trim() ||
          !String(milestone.period || "").trim() ||
          !String(milestone.amount || "").trim() ||
          !milestone.dods.some((dod) => String(dod || "").trim()),
      );
    if (hasIncompleteMilestone) {
      setStatusMessage(
        "마일스톤의 제목, 기간, 금액과 완료 조건을 모두 확인해 주세요.",
      );
      return;
    }

    setIsGenerating(true);
    setStatusMessage(
      "🔍 AI 번역 엔진이 문맥을 분석하여 영문 SOW를 실시간 생성 중입니다...",
    );

    try {
      const result = await generateEnglishSowWithLLM({ projectTitle: context.title, assigneeName: context.assigneeName, workDetail: textToAnalyze, startDate: context.startDate, endDate: context.endDate, milestones });
      setEnglishSow(result);
      setStatusMessage("✅ AI 번역 기반 영문 업무 명세서 생성이 완료되었습니다!");
    } catch (e) {
      console.error(e);
      setStatusMessage(`❌ 영문 SOW 생성 실패: ${e instanceof Error ? e.message : "AI 호출을 완료하지 못했습니다."}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setIsError(false);
    setStatusMessage("💾 SOW 작성 내용을 저장하는 중입니다...");

    const result = await saveSowDraftAction({
      projectId,
      workDetail,
      startDate: context.startDate,
      endDate: context.endDate,
      budget: context.budgetAmount.toString(),
      milestones: milestones.map(({ code, title, period, amount, dods }) => ({
        code,
        title,
        period,
        amount,
        dods,
      })),
      englishSow: englishSow ?? undefined,
    });

    setIsSavingDraft(false);
    if (!result.ok) {
      setIsError(true);
      setStatusMessage(`❌ 임시 저장에 실패했습니다: ${result.error.message}`);
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setStatusMessage(`💾 SOW 작성 내용이 임시 저장되었습니다 (v${result.data.versionNumber}).`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRequestApproval = async (snapshot: ApprovalSowSnapshot) => {
    setIsSubmitting(true);
    setIsError(false);
    setStatusMessage("검토 요청을 저장하는 중입니다...");

    const result = await submitSowForReviewAction({
      projectId,
      workDetail,
      startDate: context.startDate,
      endDate: context.endDate,
      budget: context.budgetAmount.toString(),
      milestones: milestones.map(({ code, title, period, amount, dods }) => ({
        code,
        title,
        period,
        amount,
        dods,
      })),
      englishSow: englishSow ?? undefined,
      printText: snapshot.printText,
      pdfFileName: snapshot.pdfFileName,
    });

    setIsSubmitting(false);
    if (!result.ok) {
      setIsError(true);
      setStatusMessage(`❌ 검토 요청 저장에 실패했습니다: ${result.error.message}`);
      setTimeout(() => setStatusMessage(null), 5000);
      return;
    }

    setStatusMessage("✅ 업무 명세서 검토 요청이 저장되었고, 승인 탭으로 전달했습니다.");
    router.push(`/company/projects/${projectId}/approval`);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* 로딩 오버레이 (화면 정중앙) */}
      {(isGenerating || isAnalyzing) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 shadow-2xl">
            <Loader2 className="size-14 animate-spin text-brand-500" />
            <p className="text-xl font-semibold text-slate-900">
              {isGenerating ? "AI 영문 명세서 생성 중..." : "AI 마일스톤 분석 중..."}
            </p>
            <p className="text-sm text-slate-500">
              {isGenerating ? "완벽한 번역을 위해 문맥을 분석하고 있습니다." : "최적의 일정과 완료 조건을 구성하고 있습니다."}
            </p>
          </div>
        </div>
      )}

      {isRevisionMode ? (
        <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#F95803] uppercase">
            SOW Revision
          </p>
          <h1 className="mt-2 text-2xl font-bold text-app-foreground">업무명세서 수정</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-app-muted">
            프리랜서 수정 요청을 반영해 기존 업무명세서를 수정하고, 영어 SOW를 다시 생성한 뒤 수정본 승인 요청을 보냅니다.
          </p>
        </section>
      ) : null}
      {/* 상태 메시지 알림 바 */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-control border p-3.5 text-xs animate-fade-in ${
            isError
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-brand-200 bg-brand-50 text-brand-900"
          }`}
        >
          {isError ? (
            <CircleAlert className="size-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. 메인 2컬럼 레이아웃 (한국어 작성 Form vs 영어 업무 명세서 AI 생성) */}
      {isRevisionMode ? (
        <section className="rounded-card border border-[#F95803]/30 bg-[#FFF3ED] p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-control bg-white text-[#F95803]">
              <MessageSquareText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.1em] text-[#F95803] uppercase">
                Revision Mode
              </p>
              <h2 className="mt-1 text-lg font-semibold text-app-foreground">프리랜서 수정 요청</h2>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                아래 한국어 업무명세서를 수정한 뒤 영어 SOW를 다시 생성하고 수정본 승인 요청을 보내세요.
              </p>

              <div className="mt-4 space-y-3">
                {context.revisionRequests.length ? (
                  context.revisionRequests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-control border border-[#F95803]/20 bg-white p-4"
                    >
                      <p className="text-xs text-app-muted">
                        {request.requesterName ?? "프리랜서"} · {formatRevisionRequestDateTime(request.requestedAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-foreground">
                        {request.reason}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-control border border-[#F95803]/20 bg-white p-4 text-sm text-app-muted">
                    현재 불러온 수정 요청이 없습니다. 필요한 경우 승인 탭에서 최신 요청 상태를 다시 확인하세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className={`flex flex-col xl:flex-row items-start ${englishSow && expandedPane === "none" ? "gap-6" : ""}`}>
        {/* Left Column: 한국어 업무 명세서 작성 Form */}
        {(expandedPane === "none" || expandedPane === "korean") && (
          <div className={expandedPane === "korean" || !englishSow ? "w-full shrink-0" : "w-full xl:w-[calc(50%-12px)] shrink-0"}>
            <SowKoreanForm
              workDetail={workDetail}
              setWorkDetail={setWorkDetail}
              milestones={milestones}
              setMilestones={setMilestones}
              onAnalyzeAI={handleAnalyzeAI}
              onGenerateEnglishSOW={handleGenerateEnglishSOW}
              isGenerating={isGenerating}
              onSaveDraft={handleSaveDraft}
              isAnalyzing={isAnalyzing || isSavingDraft}
              isExpanded={expandedPane === "korean"}
              onToggleExpand={() => setExpandedPane(expandedPane === "korean" ? "none" : "korean")}
            />
          </div>
        )}

        {/* Right Column: 영어 업무 명세서 (AI 생성) */}
        {englishSow && (expandedPane === "none" || expandedPane === "english") && (
          <div className={expandedPane === "english" ? "w-full shrink-0" : "w-full xl:w-[calc(50%-12px)] shrink-0"}>
            <SowEnglishPreview
              projectId={projectId}
              sow={englishSow}
              onRequestApproval={handleRequestApproval}
              isSubmitting={isSubmitting}
              approvalRequestLabel={isRevisionMode && englishSow ? `v${englishSow.version} 수정본 승인 요청` : undefined}
              isExpanded={expandedPane === "english"}
              onToggleExpand={() => setExpandedPane(expandedPane === "english" ? "none" : "english")}
            />
          </div>
        )}
      </div>
      {isSubmitting ? (
        <p className="text-xs text-app-muted">검토 요청을 저장하는 중입니다...</p>
      ) : null}
    </div>
  );
}
