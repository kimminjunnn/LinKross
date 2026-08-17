"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";

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
import type { SowWorkspaceContext } from "@/lib/backend";

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

export function SowWorkspace({ context }: { context: SowWorkspaceContext }) {
  if (context.lifecycleStage !== "preparing") {
    return <ApprovalPage />;
  }

  return <SowDraftWorkspace context={context} />;
}

function SowDraftWorkspace({ context }: { context: SowWorkspaceContext }) {
  const router = useRouter();
  const projectId = context.projectId;

  const [workDetail, setWorkDetail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [milestones, setMilestones] =
    useState<MilestoneInput[]>(INITIAL_MILESTONES);
  const [englishSow, setEnglishSow] = useState<EnglishSOWResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI 분석 실행 (LLM 기반)
  const handleAnalyzeAI = async (fileContent?: string) => {
    let textToAnalyze = workDetail;
    if (budget.trim()) {
      textToAnalyze = `예산: ${budget} USDC\n\n${textToAnalyze}`;
    }
    const combinedDetail = [textToAnalyze, fileContent].filter(Boolean).join("\n\n---\n\n");

    if (!combinedDetail.trim()) {
      setStatusMessage("업무 상세를 먼저 입력하거나 파일을 업로드해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage("✨ AI(LLM)가 문맥을 분석하여 최적의 마일스톤을 설계하고 있습니다...");

    try {
      const analysis = await analyzeWorkDetailWithLLM(combinedDetail, startDate, endDate);

      if (analysis.extractedStartDate) setStartDate(analysis.extractedStartDate);
      if (analysis.extractedEndDate) setEndDate(analysis.extractedEndDate);

      if (analysis.extractedBudget && !budget) {
        const budgetNumStr = analysis.extractedBudget.replace(/[^0-9]/g, "");
        setBudget(budgetNumStr);
      }

      setMilestones(analysis.milestones);
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

    if (!startDate.trim() || !endDate.trim()) {
      setDateError(true);
      return;
    } else {
      setDateError(false);
    }

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
      const result = await generateEnglishSowWithLLM({ projectTitle: context.title, assigneeName: context.assigneeName, workDetail: textToAnalyze, startDate, endDate, milestones });
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
      startDate,
      endDate,
      budget,
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
      startDate,
      endDate,
      budget,
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
    <div className="flex flex-col gap-6">
      {/* 상태 메시지 알림 바 */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-control border p-3.5 text-xs font-bold animate-fade-in ${
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
      <div className="grid gap-6 xl:grid-cols-12 items-start">
        {/* Left Column: 한국어 업무 명세서 작성 Form */}
        <div className="xl:col-span-6">
          <SowKoreanForm
            workDetail={workDetail}
            setWorkDetail={setWorkDetail}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            budget={budget}
            setBudget={setBudget}
            milestones={milestones}
            setMilestones={setMilestones}
            onAnalyzeAI={handleAnalyzeAI}
            onGenerateEnglishSOW={handleGenerateEnglishSOW}
            isGenerating={isGenerating}
            onSaveDraft={handleSaveDraft}
            dateError={dateError}
            isAnalyzing={isAnalyzing || isSavingDraft}
          />
        </div>

        {/* Right Column: 영어 업무 명세서 (AI 생성) */}
        <div className="xl:col-span-6">
          <SowEnglishPreview
            projectId={projectId}
            sow={englishSow}
            onRequestApproval={handleRequestApproval}
          />
        </div>
      </div>
      {isSubmitting ? (
        <p className="text-xs font-bold text-app-muted">검토 요청을 저장하는 중입니다...</p>
      ) : null}
    </div>
  );
}
