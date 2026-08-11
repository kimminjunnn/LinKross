"use client";

import React, { useState } from "react";
import { Plus, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import { MilestoneInput } from "@/lib/rag-translator";

type SowKoreanFormProps = {
  workDetail: string;
  setWorkDetail: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  milestones: MilestoneInput[];
  setMilestones: React.Dispatch<React.SetStateAction<MilestoneInput[]>>;
  onAnalyzeAI: () => void;
  onGenerateEnglishSOW: () => void;
  isGenerating: boolean;
  onSaveDraft: () => void;
};

export function SowKoreanForm({
  workDetail,
  setWorkDetail,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  milestones,
  setMilestones,
  onAnalyzeAI,
  onGenerateEnglishSOW,
  isGenerating,
  onSaveDraft,
}: SowKoreanFormProps) {
  const [links, setLinks] = useState<string[]>([]);
  const [newLinkInput, setNewLinkInput] = useState("");

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
        m.id === mId ? { ...m, dods: [...m.dods, ""] } : m
      )
    );
  };

  const handleUpdateDoD = (mId: string, index: number, value: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        const newDods = [...m.dods];
        newDods[index] = value;
        return { ...m, dods: newDods };
      })
    );
  };

  const handleRemoveDoD = (mId: string, index: number) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        const newDods = m.dods.filter((_, i) => i !== index);
        return { ...m, dods: newDods };
      })
    );
  };

  const handleAddLink = () => {
    if (!newLinkInput.trim()) return;
    setLinks([...links, newLinkInput.trim()]);
    setNewLinkInput("");
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  // 총예산 산출
  const totalAmount = (milestones || []).reduce((sum, m) => {
    const amountStr = typeof m?.amount === 'string' ? m.amount : String(m?.amount || "");
    const num = parseInt(amountStr.replace(/[^0-9]/g, ""), 10) || 0;
    return sum + num;
  }, 0);

  return (
    <section className="flex flex-col rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <div className="border-b border-app-border pb-4">
        <h2 className="text-lg font-black text-app-foreground">한국어 업무 명세서 작성 Form</h2>
        <p className="mt-1 text-xs text-app-muted">
          작업자가 프롬프트 작성하듯 자유롭게 입력하고, 마일스톤 및 DoD(완료 정의)를 설정합니다.
        </p>
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
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onAnalyzeAI}
            className="inline-flex min-h-10 items-center gap-2 rounded-control bg-app-foreground px-4 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            <Sparkles aria-hidden="true" className="size-3.5 text-brand-400" />
            AI 분석
          </button>
          <span className="text-[0.75rem] text-app-muted">
            업무 상세를 분석해 마일스톤 개수 · 일정 · 금액 · DoD 초안을 자동 설정합니다.
          </span>
        </div>
      </div>

      {/* 시작일 / 종료일 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date-input" className="block text-xs font-bold text-app-foreground">
            시작일
          </label>
          <input
            id="start-date-input"
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="YYYY.MM.DD"
            className="mt-1.5 min-h-10 w-full rounded-control border border-app-border bg-app-surface-subtle px-3 text-sm text-app-foreground outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label htmlFor="end-date-input" className="block text-xs font-bold text-app-foreground">
            종료일
          </label>
          <input
            id="end-date-input"
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="YYYY.MM.DD"
            className="mt-1.5 min-h-10 w-full rounded-control border border-app-border bg-app-surface-subtle px-3 text-sm text-app-foreground outline-none focus:border-brand-500"
          />
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
          <span className="rounded-pill bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
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
                <div className="flex items-center gap-2">
                  <span className="rounded bg-app-foreground px-2 py-0.5 text-xs font-bold text-white">
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
                    className="bg-transparent text-sm font-bold text-app-foreground outline-none focus:underline"
                  />
                </div>
                <div className="flex items-center gap-3">
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
                    className="w-24 text-right text-xs font-semibold text-app-muted outline-none"
                  />
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
                    className="w-24 text-right text-xs font-bold text-app-foreground outline-none"
                  />
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="text-app-muted hover:text-danger"
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
                {m.dods.map((dod, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2">
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
                ))}
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

      {/* 참고자료 파일 업로드 영역 */}
      <div className="mt-6 border-t border-app-border pt-5">
        <label className="block text-xs font-bold text-app-foreground">
          참고자료 파일 업로드 — 드래그 또는 클릭
        </label>
        <div className="mt-2 flex flex-col items-center justify-center rounded-control border border-dashed border-app-border bg-app-surface-subtle p-4 text-center">
          <UploadCloud className="size-6 text-app-muted" />
          <p className="mt-1 text-xs text-app-muted">GitHub / Figma / Notion 링크 첨부 가능</p>
        </div>

        {/* 링크 목록 */}
        <div className="mt-3 space-y-1.5">
          {links.map((link, lIdx) => (
            <div key={lIdx} className="flex items-center justify-between rounded bg-app-surface-subtle px-3 py-1.5 text-xs text-app-muted">
              <span className="truncate">{link}</span>
              <button type="button" onClick={() => handleRemoveLink(lIdx)} className="text-app-muted hover:text-danger">
                <X className="size-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://..."
              value={newLinkInput}
              onChange={(e) => setNewLinkInput(e.target.value)}
              className="min-h-8 flex-1 rounded border border-app-border px-2 text-xs outline-none"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="rounded bg-app-foreground px-3 text-xs font-bold text-white"
            >
              추가
            </button>
          </div>
        </div>
      </div>

      {/* 하단 실행 버튼 */}
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={onGenerateEnglishSOW}
          disabled={isGenerating}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-app-foreground px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className={`size-4 text-brand-400 ${isGenerating ? "animate-spin" : ""}`} />
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
