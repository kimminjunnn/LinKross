"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftRight, CheckCircle2, ChevronRight } from "lucide-react";

import { SowKoreanForm } from "@/components/sow/sow-korean-form";
import { SowEnglishPreview } from "@/components/sow/sow-english-preview";
import {
  EnglishSOWResult,
  generateSOWWithRAGAsync,
  analyzeWorkDetail,
  MilestoneInput,
} from "@/lib/rag-translator";
import {
  ApprovalSowSnapshot,
  saveApprovalSowSnapshot,
} from "@/lib/sow-approval";
import { PROJECTS } from "@/data/projects";

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

export default function SowPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const project = PROJECTS.find((p) => p.id === projectId) || PROJECTS[0];

  const [workDetail, setWorkDetail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [milestones, setMilestones] =
    useState<MilestoneInput[]>(INITIAL_MILESTONES);
  const [englishSow, setEnglishSow] = useState<EnglishSOWResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "초기 영문 명세서를 불러오는 중입니다...",
  );

  const applyProjectContext = (result: EnglishSOWResult): EnglishSOWResult => ({
    ...result,
    header: {
      ...result.header,
      projectName: project.name,
      client: "박피오",
      vendor: project.assignee,
      effectiveDate: `${startDate} ~ ${endDate}`,
    },
  });

  // 초기 렌더링 시 비동기 RAG 엔진 동작
  React.useEffect(() => {
    generateSOWWithRAGAsync(workDetail, startDate, endDate, INITIAL_MILESTONES)
      .then((result) => setEnglishSow(applyProjectContext(result)))
      .catch((e) => console.error("Initial SOW generation failed:", e))
      .finally(() => {
        setIsGenerating(false);
        setStatusMessage(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI 분석 실행 (한국어 폼 자동 정돈)
  const handleAnalyzeAI = () => {
    if (!workDetail.trim()) {
      setStatusMessage("업무 상세를 먼저 입력해 주세요.");
      return;
    }

    const analysis = analyzeWorkDetail(workDetail, startDate, endDate);
    if (analysis.extractedStartDate) setStartDate(analysis.extractedStartDate);
    if (analysis.extractedEndDate) setEndDate(analysis.extractedEndDate);
    setMilestones(analysis.milestones);
    const hasUnscheduledMilestone = analysis.milestones.some(
      (milestone) => !milestone.period,
    );
    setStatusMessage(
      hasUnscheduledMilestone
        ? "마일스톤 초안을 생성했습니다. 일정 분배를 위해 올바른 시작일과 종료일을 입력해 주세요."
        : "✨ AI가 날짜, 예산을 분석하여 마일스톤 초안을 생성했습니다.",
    );
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // RAG 기반 영문 명세 생성 (비동기 변환)
  const handleGenerateEnglishSOW = async () => {
    if (!workDetail.trim()) {
      setStatusMessage("업무 상세를 먼저 입력해 주세요.");
      return;
    }

    const hasIncompleteMilestone =
      milestones.length === 0 ||
      milestones.some(
        (milestone) =>
          !milestone.title.trim() ||
          !milestone.period.trim() ||
          !milestone.amount.trim() ||
          !milestone.dods.some((dod) => dod.trim()),
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
      const result = await generateSOWWithRAGAsync(workDetail, startDate, endDate, milestones);
      setEnglishSow(applyProjectContext(result));
      setStatusMessage("✅ AI 번역 기반 영문 업무 명세서 생성이 완료되었습니다!");
    } catch (e) {
      console.error(e);
      setStatusMessage("❌ 번역 API 호출에 실패했습니다.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSaveDraft = () => {
    setStatusMessage("💾 SOW 작성 내용이 임시 저장되었습니다.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRequestApproval = (snapshot: ApprovalSowSnapshot) => {
    saveApprovalSowSnapshot(projectId, snapshot);
    setStatusMessage("✅ PDF 인쇄 원본을 기준으로 승인 탭에 업무 명세서를 전달했습니다.");
    router.push(`/projects/${projectId}/approval`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 상단 프로젝트 빵부시 및 프로젝트 기본 정보 카드 */}
      <div className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-app-foreground sm:text-2xl">
                {project.name}
              </h1>
              <span className="rounded-pill bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                명세 작성 중
              </span>
            </div>
            <nav
              aria-label="Breadcrumb"
              className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-app-muted"
            >
              <span>대시보드</span>
              <ChevronRight className="size-3" />
              <span>진행 중인 프로젝트</span>
              <ChevronRight className="size-3" />
              <span className="font-semibold text-app-foreground">
                {project.name} · 프리랜서 {project.assignee} · 기간{" "}
                {project.period} · 총예산 {project.amount}
              </span>
            </nav>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mt-4 flex gap-4 border-b border-app-border text-xs font-bold">
          <button className="border-b-2 border-brand-500 pb-2.5 text-brand-600">
            AI 업무 명세
          </button>
          <button className="pb-2.5 text-app-muted hover:text-app-foreground">
            마일스톤 · 검수
          </button>
          <button className="pb-2.5 text-app-muted hover:text-app-foreground">
            지급
          </button>
          <button className="pb-2.5 text-app-muted hover:text-app-foreground">
            증빙
          </button>
        </div>
      </div>

      {/* 상태 메시지 알림 바 */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-control border border-brand-200 bg-brand-50 p-3.5 text-xs font-bold text-brand-900 animate-fade-in">
          <CheckCircle2 className="size-4 text-brand-600 shrink-0" />
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
            milestones={milestones}
            setMilestones={setMilestones}
            onAnalyzeAI={handleAnalyzeAI}
            onGenerateEnglishSOW={handleGenerateEnglishSOW}
            isGenerating={isGenerating}
            onSaveDraft={handleSaveDraft}
          />
        </div>

        {/* Center Indicator (Large screen only) */}
        <div className="hidden xl:flex xl:col-span-1 flex-col items-center justify-center space-y-4 pt-48 text-center text-xs font-bold text-app-muted">
          <div className="flex flex-col items-center gap-1 rounded-control bg-app-surface-subtle p-2 border border-app-border">
            <span>비교</span>
            <ArrowLeftRight className="size-4 text-brand-500" />
            <span className="text-[0.65rem]">AI 변환 결과</span>
          </div>
        </div>

        {/* Right Column: 영어 업무 명세서 (AI 생성) */}
        <div className="xl:col-span-5">
          <SowEnglishPreview
            projectId={projectId}
            sow={englishSow}
            onRequestApproval={handleRequestApproval}
          />
        </div>
      </div>
    </div>
  );
}
