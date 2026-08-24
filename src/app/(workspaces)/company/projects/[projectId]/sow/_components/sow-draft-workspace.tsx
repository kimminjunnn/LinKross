"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2, MessageSquareText } from "lucide-react";

const ApprovalPage = dynamic(() => import("../../approval/page"));

import { SowKoreanForm } from "@/components/sow/sow-korean-form";
import { SowEnglishPreview } from "@/components/sow/sow-english-preview";
import { LinkrossLoadingMark } from "@/components/layout/linkross-loading-mark";
import {
  EnglishSOWResult,
  MilestoneInput,
} from "@/lib/rag-translator";
import {
  analyzeDodsForVerificationWithLLM,
  analyzeWorkDetailWithLLM,
  finalizeDodForVerificationWithLLM,
  generateEnglishSowWithLLM,
  type DodVerificationAnalysisResult,
} from "@/app/actions/analyze";
import { saveSowDraftAction, submitSowForReviewAction } from "@/app/actions/sow";
import {
  ApprovalSowSnapshot,
} from "@/lib/sow-approval";
import type { SaveSowVersionOutput, SowWorkspaceContext, SowWorkspaceDraft } from "@/lib/backend";
import { contractToTestHint } from "@/lib/dod-test-contract";
import { conversationFromRequirements, summarizeDesigns } from "@/lib/dod-verification-state";

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
    verificationDesigns: milestone.verificationDesigns,
  }));
}

function mergeVerificationDesignResults(
  milestones: MilestoneInput[],
  results: SaveSowVersionOutput["verificationDesigns"],
): MilestoneInput[] {
  return milestones.map((milestone) => {
    const verificationDesigns = [...(milestone.verificationDesigns ?? [])];
    const dods = [...milestone.dods];
    for (const result of results) {
      if (result.milestoneCode !== milestone.code) continue;
      verificationDesigns[result.dodIndex] = result.design;
      dods[result.dodIndex] = result.description;
    }
    return { ...milestone, dods, verificationDesigns };
  });
}

function mergeDodAnalysisResults(
  milestones: MilestoneInput[],
  results: DodVerificationAnalysisResult[],
): MilestoneInput[] {
  return milestones.map((milestone) => {
    const dods = [...milestone.dods];
    const verificationDesigns = [...(milestone.verificationDesigns ?? [])];
    for (const result of results) {
      if (result.milestoneCode !== milestone.code) continue;
      dods[result.dodIndex] = result.revisedDod;
      verificationDesigns[result.dodIndex] = result.design;
    }
    return { ...milestone, dods, verificationDesigns };
  });
}

function buildConversation(
  requirements: NonNullable<NonNullable<MilestoneInput["verificationDesigns"]>[number]["requirements"]>,
) {
  return conversationFromRequirements(requirements);
}

function milestoneContentSignature(milestones: MilestoneInput[]): string {
  return JSON.stringify(milestones.map(({ code, title, period, amount, dods }) => ({
    code,
    title,
    period,
    amount,
    dods,
  })));
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

function getNextSubmittedSowVersion(draft: SowWorkspaceDraft | null) {
  if (!draft) return null;
  return draft.status === "draft" ? draft.versionNumber : draft.versionNumber + 1;
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
  const [isDesigningVerification, setIsDesigningVerification] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clarifyingDodKeys, setClarifyingDodKeys] = useState<string[]>([]);
  const [validatingDodKeys, setValidatingDodKeys] = useState<string[]>([]);
  const [expandedPane, setExpandedPane] = useState<"none" | "korean" | "english">("none");
  const milestonesRef = useRef(milestones);
  const validationFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValidationKeysRef = useRef(new Set<string>());
  const isValidatingSpecsRef = useRef(false);
  useEffect(() => {
    milestonesRef.current = milestones;
  }, [milestones]);

  const runVerificationDesignAnalysis = async (
    initialMilestones: MilestoneInput[],
    // 프리셋으로 받은 완료조건은 검수 계약과 실행 스펙이 이미 확정돼 있다.
    // 다시 분석하면 확정된 스펙을 LLM 응답으로 덮어쓸 뿐이고, 완료조건 수만큼
    // 호출이 늘어 화면이 몇 분을 기다린다.
    hasSettledDesigns = false,
  ) => {
    const initialSignature = milestoneContentSignature(initialMilestones);
    const totalDodCount = initialMilestones.reduce((count, milestone) => count + milestone.dods.length, 0);
    setIsDesigningVerification(true);
    // 확정된 설계로 들어왔는지는 화면 문구로 드러내지 않는다. 발주자가 보는 것은
    // 어느 경로로 왔는지가 아니라 완료조건 몇 개가 어디까지 진행됐는지다.
    setStatusMessage(
      hasSettledDesigns
        ? `🧪 DoD 자동화 가능성 분석 완료 · ${totalDodCount}/${totalDodCount} · 실제 테스트 스펙을 검증하고 있습니다...`
        : `🔎 DoD 자동화 가능성을 분석하고 있습니다 · 0/${totalDodCount}`,
    );

    try {
      let analyzedMilestones = initialMilestones;
      if (!hasSettledDesigns) {
        const dodAnalysis = await analyzeDodsForVerificationWithLLM(initialMilestones);
        if (milestoneContentSignature(milestonesRef.current) !== initialSignature) {
          setStatusMessage("DoD가 수정되어 자동화 분석 결과를 적용하지 않았습니다. AI 분석을 다시 실행해 주세요.");
          return;
        }

        analyzedMilestones = mergeDodAnalysisResults(initialMilestones, dodAnalysis);
        setStatusMessage(`🧪 DoD 자동화 가능성 분석 완료 · ${totalDodCount}/${totalDodCount} · 실제 테스트 스펙을 검증하고 있습니다...`);
      }

      // 이 단계에서는 고정된 Playwright atom 스펙까지 검증한다. 사용자가 분석 중
      // DoD를 편집했다면 이전 입력을 저장하지 않고 중단한다.
      const specValidation = await saveSowDraftAction({
        projectId,
        workDetail,
        startDate: context.startDate,
        endDate: context.endDate,
        budget: context.budgetAmount.toString(),
        milestones: analyzedMilestones.map(({ code, title, period, amount, dods, verificationDesigns }) => ({
          code,
          title,
          period,
          amount,
          dods,
          verificationDesigns,
        })),
        englishSow: englishSow ?? undefined,
      });
      if (!specValidation.ok) throw new Error(specValidation.error.message);
      if (milestoneContentSignature(milestonesRef.current) !== initialSignature) {
        setStatusMessage("DoD가 수정되어 자동화 스펙 결과를 적용하지 않았습니다. AI 분석을 다시 실행해 주세요.");
        return;
      }

      const verifiedMilestones = mergeVerificationDesignResults(analyzedMilestones, specValidation.data.verificationDesigns);
      milestonesRef.current = verifiedMilestones;
      setMilestones(verifiedMilestones);
      const summary = summarizeDesigns(specValidation.data.verificationDesigns.map((item) => item.design));
      setStatusMessage(
        summary.humanReviewRequired > 0 && summary.humanReviewUnaccepted === 0 && summary.clarificationRequired === 0
          ? `✅ 자동 테스트 ${summary.automationReady}개 준비 완료 · Preview에서 직접 확인할 항목 ${summary.humanReviewRequired}개`
          : summary.clarificationRequired > 0
          ? `AI 검수 설계 완료: 답변이 필요한 DoD ${summary.clarificationRequired}개 · 자동 테스트 ${summary.automationReady}개 준비 완료`
          : summary.humanReviewUnaccepted > 0
            ? `AI 검수 설계 완료: 자동 테스트 ${summary.automationReady}개 · 직접 확인이 필요한 DoD ${summary.humanReviewUnaccepted}개`
            : `✅ 자동 테스트 ${summary.automationReady}개 준비 완료`,
      );
    } catch (verificationError) {
      console.error(verificationError);
      setStatusMessage("마일스톤은 생성됐습니다. DoD 검수 설계 분석을 완료하지 못했습니다. 다시 AI 분석을 실행해 주세요.");
    } finally {
      setIsDesigningVerification(false);
    }
  };
  const [hasRegeneratedRevisionSow, setHasRegeneratedRevisionSow] = useState(false);
  const currentRevisionVersion = revisionDraft?.versionNumber ?? null;
  const nextRevisionVersion = getNextSubmittedSowVersion(revisionDraft);
  const revisionPreviewVersion =
    isRevisionMode && currentRevisionVersion != null
      ? `v${hasRegeneratedRevisionSow && nextRevisionVersion != null ? nextRevisionVersion : currentRevisionVersion}`
      : undefined;
  const revisionApprovalRequestLabel =
    isRevisionMode && hasRegeneratedRevisionSow && nextRevisionVersion != null
      ? `v${nextRevisionVersion} 수정본 승인 요청`
      : undefined;

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
      // 첫 AI 응답만 기다린 뒤 바로 편집 화면을 연다. 이후 자동화 설계는 화면을
      // 막지 않고 진행하며, DoD를 수정하면 오래된 분석 결과를 적용하지 않는다.
      void runVerificationDesignAnalysis(cleanedMilestones, Boolean(analysis.presetId));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setStatusMessage(`❌ 분석 실패: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const flushSpecValidation = async () => {
    if (isValidatingSpecsRef.current || pendingValidationKeysRef.current.size === 0) return;
    isValidatingSpecsRef.current = true;
    const targetKeys = Array.from(pendingValidationKeysRef.current);
    pendingValidationKeysRef.current.clear();
    setValidatingDodKeys(targetKeys);
    setStatusMessage(`${targetKeys.length}개 DoD의 Playwright 자동 테스트 스펙을 검증하고 있습니다...`);

    try {
      const snapshot = milestonesRef.current;
      const specValidation = await saveSowDraftAction({
        projectId,
        workDetail,
        startDate: context.startDate,
        endDate: context.endDate,
        budget: context.budgetAmount.toString(),
        milestones: snapshot.map(({ code, title, period, amount, dods, verificationDesigns }) => ({
          code,
          title,
          period,
          amount,
          dods,
          verificationDesigns,
        })),
        englishSow: englishSow ?? undefined,
      });
      if (!specValidation.ok) throw new Error(specValidation.error.message);

      const latest = milestonesRef.current.map((milestone) => {
        const dods = [...milestone.dods];
        const verificationDesigns = [...(milestone.verificationDesigns ?? [])];
        targetKeys.forEach((key) => {
          const [, dodIndexText] = key.split(":");
          const dodIndex = Number(dodIndexText);
          const result = specValidation.data.verificationDesigns.find(
            (item) => item.milestoneCode === milestone.code && item.dodIndex === dodIndex,
          );
          if (!result || !key.startsWith(`${milestone.id}:`)) return;
          dods[dodIndex] = result.description;
          verificationDesigns[dodIndex] = result.design;
        });
        return { ...milestone, dods, verificationDesigns };
      });
      milestonesRef.current = latest;
      setMilestones(latest);
      setStatusMessage("답변을 반영했고 Playwright 자동 테스트 스펙 검증을 완료했습니다.");
    } catch (error) {
      console.error(error);
      setIsError(true);
      setStatusMessage(`❌ 자동 테스트 스펙 검증 실패: ${error instanceof Error ? error.message : "저장을 완료하지 못했습니다."}`);
    } finally {
      isValidatingSpecsRef.current = false;
      setValidatingDodKeys([]);
      if (pendingValidationKeysRef.current.size > 0) {
        validationFlushTimerRef.current = setTimeout(() => void flushSpecValidation(), 600);
      }
    }
  };

  const scheduleSpecValidation = () => {
    if (validationFlushTimerRef.current) clearTimeout(validationFlushTimerRef.current);
    validationFlushTimerRef.current = setTimeout(() => void flushSpecValidation(), 600);
  };

  const clearDodPending = (dialogueKey: string) => {
    setClarifyingDodKeys((current) => current.filter((key) => key !== dialogueKey));
  };

  /**
   * 한 DoD의 확정된 질문 전부에 대한 답변을 한 번에 받는다.
   *
   * 답변은 계약 필드에 그대로 들어가므로 여기서 새 질문이 생기지 않는다.
   * 최종 문장을 만든 뒤 저장 단계가 실행 스펙까지 만들어, 사용자가 같은 DoD로
   * 다시 돌아올 일이 없게 한다.
   */
  const handleAnswerDodClarification = async (
    milestoneId: string,
    dodIndex: number,
    answers: Record<string, string>,
  ) => {
    const dialogueKey = `${milestoneId}:${dodIndex}`;
    const milestone = milestonesRef.current.find((item) => item.id === milestoneId);
    if (!milestone) return false;
    const design = milestone.verificationDesigns?.[dodIndex];
    const requirements = (design?.requirements ?? []).map((requirement) => ({
      ...requirement,
      answer: answers[requirement.key]?.trim() || requirement.answer,
    }));
    const stillUnanswered = requirements.filter((requirement) => !requirement.answer?.trim());
    if (requirements.length === 0 || stillUnanswered.length > 0) {
      setIsError(true);
      setStatusMessage("모든 질문에 답변한 뒤 확정해 주세요.");
      return false;
    }

    setClarifyingDodKeys((current) =>
      current.includes(dialogueKey) ? current : [...current, dialogueKey],
    );

    try {
      const finalized = await finalizeDodForVerificationWithLLM({
        milestoneTitle: milestone.title,
        dod: milestone.dods[dodIndex],
        requirements,
        testContract: design?.testContract,
      });
      const nextDesign: NonNullable<MilestoneInput["verificationDesigns"]>[number] = {
        ...design,
        requirements,
        testContract: finalized.testContract,
        questionSetLocked: true,
        // 답변을 다 받아도 실행 스펙이 만들어지기 전까지는 완료가 아니다.
        // 저장 단계가 실제 스펙 생성 결과로 이 상태를 확정한다.
        status: "contract_ready",
        question: undefined,
        suggestions: undefined,
        recommendedSuggestion: undefined,
        conversation: buildConversation(requirements),
        testHint: contractToTestHint(finalized.testContract),
        humanReviewAccepted: false,
        message: finalized.isComplete
          ? "답변을 반영했습니다. 실행 가능한 자동 테스트를 만드는 중입니다."
          : `답변을 반영했지만 아직 확정되지 않은 항목이 있습니다: ${finalized.missingFields.join(", ")}`,
      };
      const updated = milestonesRef.current.map((item) => {
        if (item.id !== milestoneId) return item;
        const dods = [...item.dods];
        const verificationDesigns = [...(item.verificationDesigns ?? [])];
        dods[dodIndex] = finalized.revisedDod;
        verificationDesigns[dodIndex] = nextDesign;
        return { ...item, dods, verificationDesigns };
      });
      milestonesRef.current = updated;
      setMilestones(updated);
      clearDodPending(dialogueKey);
      pendingValidationKeysRef.current.add(dialogueKey);
      scheduleSpecValidation();
      return true;
    } catch (error) {
      console.error(error);
      clearDodPending(dialogueKey);
      setIsError(true);
      setStatusMessage(
        `❌ DoD 구체화 실패: ${error instanceof Error ? error.message : "AI 호출을 완료하지 못했습니다."}`,
      );
      return false;
    }
  };

  /**
   * 자동 테스트를 만들 수 없다고 확정된 항목을 발주자가 직접 확인하는 항목으로
   * 받아들인다. 자동 판정으로 바꾸지 않고, 사람이 확인할 항목임을 기록만 한다.
   */
  const handleAcceptHumanReview = async (milestoneId: string, dodIndex: number) => {
    const updated = milestonesRef.current.map((item) => {
      if (item.id !== milestoneId) return item;
      const verificationDesigns = [...(item.verificationDesigns ?? [])];
      const design = verificationDesigns[dodIndex];
      if (!design || design.status !== "human_review_required") return item;
      verificationDesigns[dodIndex] = { ...design, humanReviewAccepted: true };
      return { ...item, verificationDesigns };
    });
    milestonesRef.current = updated;
    setMilestones(updated);
    pendingValidationKeysRef.current.add(`${milestoneId}:${dodIndex}`);
    scheduleSpecValidation();
    return true;
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
      if (isRevisionMode) {
        setHasRegeneratedRevisionSow(true);
      }
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
      milestones: milestones.map(({ code, title, period, amount, dods, verificationDesigns }) => ({
        code,
        title,
        period,
        amount,
        dods,
        verificationDesigns,
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

    setMilestones((current) => mergeVerificationDesignResults(current, result.data.verificationDesigns));
    const saveSummary = summarizeDesigns(result.data.verificationDesigns.map((item) => item.design));
    setStatusMessage(
      saveSummary.humanReviewUnaccepted > 0
        ? `💾 임시 저장 완료 (v${result.data.versionNumber}) · 자동 테스트 ${saveSummary.automationReady}개 · 직접 확인 필요 ${saveSummary.humanReviewUnaccepted}개`
        : `💾 임시 저장 완료 (v${result.data.versionNumber}) · 자동 테스트 ${saveSummary.automationReady}개 준비 완료`,
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRequestApproval = async (snapshot: ApprovalSowSnapshot) => {
    setIsSubmitting(true);
    setIsError(false);
    setStatusMessage("DoD별 자동 검수 가능 여부와 테스트 스펙을 먼저 확인하는 중입니다...");

    const draftInput = {
      projectId,
      workDetail,
      startDate: context.startDate,
      endDate: context.endDate,
      budget: context.budgetAmount.toString(),
      milestones: milestones.map(({ code, title, period, amount, dods, verificationDesigns }) => ({
        code,
        title,
        period,
        amount,
        dods,
        verificationDesigns,
      })),
      englishSow: englishSow ?? undefined,
    };

    const preflight = await saveSowDraftAction(draftInput);
    if (!preflight.ok) {
      setIsSubmitting(false);
      setIsError(true);
      setStatusMessage(`❌ 검수 설계에 실패했습니다: ${preflight.error.message}`);
      return;
    }

    const analyzedMilestones = mergeVerificationDesignResults(milestones, preflight.data.verificationDesigns);
    setMilestones(analyzedMilestones);
    // 자동화 불가 판정 자체는 정상적인 결론이다(설계 §21.4). 발주자가 직접 확인
    // 항목으로 확정하기만 하면 제출을 막지 않는다.
    const preflightSummary = summarizeDesigns(preflight.data.verificationDesigns.map((item) => item.design));
    if (
      preflightSummary.clarificationRequired > 0 ||
      preflightSummary.humanReviewUnaccepted > 0 ||
      preflightSummary.transient > 0
    ) {
      setIsSubmitting(false);
      setIsError(true);
      const details = [
        preflightSummary.clarificationRequired ? `AI 질문 답변 ${preflightSummary.clarificationRequired}개` : null,
        preflightSummary.humanReviewUnaccepted
          ? `직접 확인 항목 확정 ${preflightSummary.humanReviewUnaccepted}개`
          : null,
        preflightSummary.transient ? `실행 스펙 생성 대기 ${preflightSummary.transient}개` : null,
      ].filter(Boolean).join(", ");
      setStatusMessage(`검토 요청 전 검수 설계를 완료해 주세요: ${details}`);
      return;
    }

    setStatusMessage(
      isRevisionMode
        ? "검수 설계가 준비되었습니다. 수정본 승인 요청을 보내는 중입니다..."
        : "검수 설계가 준비되었습니다. 검토 요청을 저장하는 중입니다...",
    );

    const result = await submitSowForReviewAction({
      ...draftInput,
      milestones: analyzedMilestones.map(({ code, title, period, amount, dods, verificationDesigns }) => ({
        code,
        title,
        period,
        amount,
        dods,
        verificationDesigns,
      })),
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
            <LinkrossLoadingMark className="size-14 animate-lk-mark-flow" />
            <p className="text-xl font-semibold text-slate-900">
              {isGenerating ? "AI 영문 명세서 생성 중..." : "AI 마일스톤·DoD 검수 설계 중..."}
            </p>
            <p className="text-sm text-slate-500">
              {isGenerating ? "완벽한 번역을 위해 문맥을 분석하고 있습니다." : "마일스톤 생성 후 DoD를 한 줄씩 검토하고 있습니다."}
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
              : isSubmitting
                ? "border-brand-200 bg-brand-50 text-brand-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {isError ? (
            <CircleAlert className="size-4 text-red-600 shrink-0" />
          ) : isSubmitting ? (
            <Loader2 className="size-4 animate-spin text-brand-600 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
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
              isAnalyzing={isAnalyzing || isSavingDraft || isDesigningVerification}
              isRevisionMode={isRevisionMode}
              isExpanded={expandedPane === "korean"}
              onToggleExpand={() => setExpandedPane(expandedPane === "korean" ? "none" : "korean")}
              onAnswerDodClarification={handleAnswerDodClarification}
              onAcceptHumanReview={handleAcceptHumanReview}
              clarifyingDodKeys={clarifyingDodKeys}
              validatingDodKeys={validatingDodKeys}
              isDesigningVerification={isDesigningVerification}
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
              displayVersion={revisionPreviewVersion}
              approvalRequestLabel={revisionApprovalRequestLabel}
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
