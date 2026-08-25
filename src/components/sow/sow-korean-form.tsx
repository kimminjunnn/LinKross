"use client";

import React, { useState } from "react";
import { Plus, Sparkles, Trash2, UploadCloud, X, ToggleLeft, ToggleRight, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { MilestoneInput } from "@/lib/rag-translator";
import { parseDocumentAction } from "@/app/actions/parse-document";
import { DodDesignPanel } from "@/components/sow/dod-design-panel";

type SowKoreanFormProps = {
  workDetail: string;
  setWorkDetail: (val: string) => void;
  milestones: MilestoneInput[];
  setMilestones: React.Dispatch<React.SetStateAction<MilestoneInput[]>>;
  onAnalyzeAI: (fileContent?: string) => void;
  onGenerateEnglishSOW: (hiddenContent?: string) => void;
  isGenerating: boolean;
  onSaveDraft: () => void;
  isAnalyzing?: boolean;
  isRevisionMode?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onAnswerDodClarification?: (
    milestoneId: string,
    dodIndex: number,
    answers: Record<string, string>,
  ) => Promise<boolean>;
  onAcceptHumanReview?: (milestoneId: string, dodIndex: number) => Promise<boolean>;
  clarifyingDodKeys?: string[];
  validatingDodKeys?: string[];
  isDesigningVerification?: boolean;
};

export function SowKoreanForm({
  workDetail,
  setWorkDetail,
  milestones,
  setMilestones,
  onAnalyzeAI,
  onGenerateEnglishSOW,
  isGenerating,
  onSaveDraft,
  isAnalyzing = false,
  isRevisionMode = false,
  isExpanded = false,
  onToggleExpand,
  onAnswerDodClarification,
  onAcceptHumanReview,
  clarifyingDodKeys = [],
  validatingDodKeys = [],
  isDesigningVerification = false,
}: SowKoreanFormProps) {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isAutoAppend, setIsAutoAppend] = useState(true);
  const [hiddenFileContent, setHiddenFileContent] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAnalyzeClick = () => {
    onAnalyzeAI(hiddenFileContent || undefined);
  };

  const handleAddMilestone = () => {
    const nextNum = milestones.length + 1;
    const newM: MilestoneInput = {
      id: `m-${Date.now()}`,
      code: `M${nextNum}`,
      title: "",
      period: "",
      amount: "",
      dods: [""],
    };
    setMilestones([...milestones, newM]);
  };

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleAddDoD = (mId: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === mId
          ? {
              ...m,
              dods: [...m.dods, ""],
              verificationDesigns: [...(m.verificationDesigns ?? []), {}],
            }
          : m
      )
    );
  };

  const handleUpdateDoD = (mId: string, index: number, value: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        const newDods = [...m.dods];
        newDods[index] = value;
        const verificationDesigns = [...(m.verificationDesigns ?? [])];
        // DoD 원문을 수정하면 이전 질문·답변·완료 상태는 더 이상 유효하지 않다.
        verificationDesigns[index] = {};
        return { ...m, dods: newDods, verificationDesigns };
      })
    );
  };

  const handleRemoveDoD = (mId: string, index: number) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        const newDods = m.dods.filter((_, i) => i !== index);
        const verificationDesigns = (m.verificationDesigns ?? []).filter((_, i) => i !== index);
        return { ...m, dods: newDods, verificationDesigns };
      })
    );
  };


  // 총예산 산출
  const totalAmount = (milestones || []).reduce((sum, m) => {
    const amountStr = typeof m?.amount === 'string' ? m.amount : String(m?.amount || "");
    const num = parseInt(amountStr.replace(/[^0-9]/g, ""), 10) || 0;
    return sum + num;
  }, 0);

  return (
    <section className="flex flex-col rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-app-border pb-4">
        <div>
          <h2 className="text-lg font-black text-app-foreground">한국어 업무 명세서 작성 Form</h2>
          <p className="mt-1 text-xs text-app-muted">
            작업자가 프롬프트 작성하듯 자유롭게 입력하고, 마일스톤 및 DoD(완료 정의)를 설정합니다.
          </p>
        </div>
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "반으로 접기" : "화면 꽉 채우기"}
            title={isExpanded ? "반으로 접기" : "화면 꽉 채우기"}
            className="grid size-8 shrink-0 place-items-center rounded-control border border-app-border bg-app-surface-subtle text-app-muted transition-colors hover:bg-app-border hover:text-brand-600"
          >
            {isExpanded ? (
              <Minimize2 aria-hidden="true" className="size-4" />
            ) : (
              <Maximize2 aria-hidden="true" className="size-4" />
            )}
          </button>
        )}
      </div>



      {/* 업무 상세 작성 */}
      <div className="mt-5">
        <label htmlFor="work-detail-input" className="block text-sm font-bold text-app-foreground">
          업무 상세
        </label>
        <textarea
          id="work-detail-input"
          value={workDetail}
          onChange={(e) => setWorkDetail(e.target.value)}
          placeholder="작업자가 프롬프트 작성하듯 자유롭게 작성&#10;프로젝트 목적 · 업무 범위(In-Scope) · 세부 작업 · 결과물 등"
          className="mt-2 min-h-36 w-full resize-y rounded-control border border-app-border bg-app-surface-subtle p-3.5 text-sm leading-6 outline-none focus:border-brand-500 focus:bg-app-surface"
        />

        {/* AI Milestone Generation Container */}
        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/5 p-4.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-700 mb-2.5">
            ✨ 문서 기반 AI 마일스톤 생성 (선택 사항)
          </label>
          
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.txt,.md,.csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setParseError(null);
                  setIsParsing(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    const result = await parseDocumentAction(formData);
                    if (result.error) {
                      setParseError(result.error);
                    } else if (result.text) {
                      if (isAutoAppend) {
                        const newText = workDetail.trim() 
                          ? `${workDetail}\n\n[첨부 파일 내용: ${file.name}]\n${result.text}` 
                          : `[첨부 파일 내용: ${file.name}]\n${result.text}`;
                        setWorkDetail(newText);
                        setHiddenFileContent("");
                        setSelectedFile(null);
                      } else {
                        setHiddenFileContent(result.text);
                      }
                    }
                  } catch (error: unknown) {
                    setParseError(
                      error instanceof Error
                        ? error.message
                        : "파일 분석 중 오류가 발생했습니다.",
                    );
                  } finally {
                    setIsParsing(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <UploadCloud className="size-3.5 text-slate-400" />
              {isParsing ? '분석 중...' : (isAutoAppend ? '파일 내용 삽입' : '파일 업로드')}
            </button>
            <button
              type="button"
              onClick={() => setIsAutoAppend(!isAutoAppend)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="켜두면 파일 업로드 즉시 상세 폼에 내용이 추가됩니다."
            >
              {isAutoAppend ? (
                <ToggleRight className="size-5 text-brand-500" />
              ) : (
                <ToggleLeft className="size-5 text-slate-400" />
              )}
              자동 삽입
            </button>
            {selectedFile && (
              <div className="flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-xs text-slate-700 font-medium">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-semibold">지원 포맷: PDF, DOCX, TXT, MD 등</span>
          </div>
          {parseError && (
            <p className="mt-1.5 text-xs text-danger font-bold">{parseError}</p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-brand-100/60 pt-4">
            <button
              type="button"
              onClick={handleAnalyzeClick}
              disabled={isParsing || isAnalyzing}
              className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-lg px-6 text-[9px] font-black text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isRevisionMode
                  ? "bg-[#F95803] shadow-[#F95803]/20"
                  : "bg-[#F95803] shadow-[#F95803]/20"
              }`}
            >
              <Sparkles aria-hidden="true" className={`size-3.5 ${isRevisionMode ? "text-white" : "text-brand-300"} ${(isParsing || isAnalyzing) ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">
                {isParsing ? "파일 분석 중..." : isAnalyzing ? "LLM 분석 중..." : "AI 분석 실행"}
              </span>
            </button>
            <span className="text-xs font-medium text-slate-500 leading-relaxed max-w-lg">
              업무 상세와 첨부 문서를 AI가 분석해 마일스톤 개수 · 일정 · 금액 · DoD 초안을 자동 생성합니다.
            </span>
          </div>
        </div>
      </div>



      {/* 마일스톤 설정 */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-app-foreground">마일스톤 설정</h3>
            <p className="text-[0.75rem] text-app-muted">
              AI 분석 결과 자동 생성 · 각 행 직접 수정 가능 · 마일스톤별 DoD 입력
            </p>
          </div>
          <span className="rounded-md bg-slate-900 border border-slate-950 px-3 py-1.5 text-xs font-black font-mono text-white shadow-2xs">
            합계 {totalAmount.toLocaleString()} USDC
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="relative rounded-control border border-app-border bg-app-surface-subtle p-4"
            >
              <div className="flex items-center justify-between gap-2 border-b border-app-border/60 pb-2">
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <span className="shrink-0 rounded bg-app-foreground px-2 py-0.5 text-xs font-bold text-white">
                    {m.code}
                  </span>
                  <input
                    type="text"
                    value={m.title}
                    placeholder="마일스톤 제목"
                    onChange={(e) => {
                      const val = e.target.value;
                      setMilestones((prev) =>
                        prev.map((item) => (item.id === m.id ? { ...item, title: val } : item))
                      );
                    }}
                    className="w-full bg-transparent text-sm font-bold text-app-foreground outline-none focus:underline"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <input
                      type="text"
                      value={m.amount}
                      placeholder="금액"
                      onChange={(e) => {
                        const val = e.target.value;
                        setMilestones((prev) =>
                          prev.map((item) => (item.id === m.id ? { ...item, amount: val } : item))
                        );
                      }}
                      className="w-36 sm:w-48 text-right text-xs font-bold text-app-foreground outline-none placeholder:text-app-muted/50 focus:underline"
                    />
                    <input
                      type="text"
                      value={m.period}
                      placeholder="기간"
                      onChange={(e) => {
                        const val = e.target.value;
                        setMilestones((prev) =>
                          prev.map((item) => (item.id === m.id ? { ...item, period: val } : item))
                        );
                      }}
                      className="w-36 sm:w-48 text-right text-[0.7rem] font-semibold text-app-muted outline-none placeholder:text-app-muted/50 focus:underline"
                    />
                  </div>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="text-app-muted hover:text-danger mt-0.5"
                      aria-label="마일스톤 삭제"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* DoD 목록 */}
              <div className="mt-3 space-y-2">
                <span className="text-[0.7rem] font-bold text-app-muted uppercase">DoD (Definition of Done)</span>
                {m.dods.map((dod, dIdx) => {
                  const design = m.verificationDesigns?.[dIdx];
                  const dialogueKey = `${m.id}:${dIdx}`;
                  return (
                    <div key={dIdx} className="rounded-control border border-app-border bg-app-surface-subtle p-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dod}
                          placeholder="완료 조건 입력"
                          onChange={(e) => handleUpdateDoD(m.id, dIdx, e.target.value)}
                          className="min-h-9 flex-1 rounded-control border border-app-border bg-app-surface px-3 text-xs text-app-foreground outline-none focus:border-brand-500"
                        />
                        {m.dods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoD(m.id, dIdx)}
                            className="text-app-muted hover:text-danger"
                            aria-label="DoD 삭제"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <DodDesignPanel
                        design={design}
                        dialogueKey={dialogueKey}
                        isAnswering={clarifyingDodKeys.includes(dialogueKey)}
                        isValidating={validatingDodKeys.includes(dialogueKey)}
                        isDesigningVerification={isDesigningVerification}
                        onSubmitAnswers={
                          onAnswerDodClarification
                            ? (answers) => onAnswerDodClarification(m.id, dIdx, answers)
                            : undefined
                        }
                        onAcceptHumanReview={
                          onAcceptHumanReview ? () => onAcceptHumanReview(m.id, dIdx) : undefined
                        }
                      />
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleAddDoD(m.id)}
                  className="mt-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  + DoD 추가
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddMilestone}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-app-border text-xs font-bold text-app-muted hover:border-brand-400 hover:text-brand-600"
        >
          <Plus className="size-3.5" />
          마일스톤 추가
        </button>
      </div>


      {/* 하단 실행 버튼 */}
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => onGenerateEnglishSOW(hiddenFileContent || undefined)}
          disabled={isGenerating}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-app-foreground px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin text-brand-400" />
          ) : (
            <Sparkles className="size-4 text-brand-400" />
          )}
          {isGenerating ? "RAG 영문 번역 변환 중..." : "AI 영문 명세 생성 (변환)"}
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="min-h-11 rounded-control border border-app-border-strong px-5 text-sm font-bold text-app-foreground hover:bg-app-surface-subtle"
        >
          임시 저장
        </button>
      </div>
    </section>
  );
}
