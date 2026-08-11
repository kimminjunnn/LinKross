"use client";

import React, { useState } from "react";
import { ArrowLeftRight, CheckCircle2, ChevronRight } from "lucide-react";

import { SowKoreanForm } from "@/components/sow/sow-korean-form";
import { SowEnglishPreview } from "@/components/sow/sow-english-preview";
import {
  EnglishSOWResult,
  generateSOWWithRAG,
  generateSOWWithRAGAsync,
  analyzeWorkDetail,
  MilestoneInput,
} from "@/lib/rag-translator";

const INITIAL_MILESTONES: MilestoneInput[] = [
  {
    id: "m-1",
    code: "M1",
    title: "초기 시스템 구현",
    period: "08.10 – 08.20",
    amount: "1,000 USDC",
    dods: [
      "스켈레톤 API 및 인증 데이터베이스 스키마 생성",
      "단위 테스트 통과 및 CI 연동 완료",
    ],
  },
  {
    id: "m-2",
    code: "M2",
    title: "핵심 기능 · 결과물",
    period: "08.21 – 09.01",
    amount: "1,200 USDC",
    dods: [
      "PG 샌드박스 연동 검증 · CI 통과",
      "사용자 로그인 후 대시보드 리다이렉트",
    ],
  },
  {
    id: "m-3",
    code: "M3",
    title: "문서화 · 결과물",
    period: "09.02 – 09.14",
    amount: "800 USDC",
    dods: [
      "문서 갱신 · PR 머지 완료",
      "기술 인수인계 가이드 작성",
    ],
  },
];

import { useParams } from "next/navigation";
import { PROJECTS } from "@/data/projects";

export default function SowPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const project = PROJECTS.find((p) => p.id === projectId) || PROJECTS[0];

  const [workDetail, setWorkDetail] = useState(
    "작업자가 프롬프트 작성하듯 자유롭게 작성\n프로젝트 목적: 결제 모듈 API 개발 및 해외 연동\nIn-Scope: PG 샌드박스 연동, 스켈레톤 API 구축, CI 통과 및 단위 테스트 완료\n세부 작업: 결제 웹훅 처리, 사용자 대시보드 이동, 인수인계 문서화"
  );
  const [startDate, setStartDate] = useState("2026.08.10");
  const [endDate, setEndDate] = useState("2026.09.14");
  const [milestones, setMilestones] = useState<MilestoneInput[]>(INITIAL_MILESTONES);
  const [englishSow, setEnglishSow] = useState<EnglishSOWResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 초기 렌더링 시 비동기 RAG 엔진 동작
  React.useEffect(() => {
    setIsGenerating(true);
    setStatusMessage("초기 영문 명세서를 불러오는 중입니다...");
    generateSOWWithRAGAsync(workDetail, startDate, endDate, INITIAL_MILESTONES)
      .then(setEnglishSow)
      .catch((e) => console.error("Initial SOW generation failed:", e))
      .finally(() => {
        setIsGenerating(false);
        setStatusMessage(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI 분석 실행 (한국어 폼 자동 정돈)
  const handleAnalyzeAI = () => {
    const analysis = analyzeWorkDetail(workDetail, startDate, endDate);
    if (analysis.extractedStartDate) setStartDate(analysis.extractedStartDate);
    if (analysis.extractedEndDate) setEndDate(analysis.extractedEndDate);
    setMilestones(analysis.milestones);
    setStatusMessage("✨ AI가 날짜, 예산을 분석하여 마일스톤 초안을 생성했습니다.");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // RAG 기반 영문 명세 생성 (비동기 변환)
  const handleGenerateEnglishSOW = async () => {
    setIsGenerating(true);
    setStatusMessage("🔍 AI 번역 엔진이 문맥을 분석하여 영문 SOW를 실시간 생성 중입니다...");

    try {
      const result = await generateSOWWithRAGAsync(workDetail, startDate, endDate, milestones);
      setEnglishSow(result);
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

  const handleRequestApproval = () => {
    alert("해외 프리랜서에게 영문 SOW 승인 요청 알림이 전송되었습니다!");
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
            <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-app-muted">
              <span>대시보드</span>
              <ChevronRight className="size-3" />
              <span>진행 중인 프로젝트</span>
              <ChevronRight className="size-3" />
              <span className="font-semibold text-app-foreground">
                {project.name} · 프리랜서 {project.assignee} · 기간 {project.period} · 총예산 {project.amount}
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
            sow={englishSow}
            onRequestApproval={handleRequestApproval}
          />
        </div>
      </div>
    </div>
  );
}
