"use client";

import React, { useState, useRef } from "react";
import { Check, ChevronDown, ChevronUp, Download, Send, Edit3, BookOpen } from "lucide-react";
import { EnglishSOWResult } from "@/lib/rag-translator";

type SowEnglishPreviewProps = {
  sow: EnglishSOWResult | null;
  onRequestApproval: () => void;
};

export function SowEnglishPreview({
  sow,
  onRequestApproval,
}: SowEnglishPreviewProps) {
  const [showOriginalContrast, setShowOriginalContrast] = useState(true);
  const [isPmVerified, setIsPmVerified] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const sowContentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    window.print();
  };

  if (!sow) {
    return (
      <section className="flex flex-col items-center justify-center rounded-card border border-app-border bg-app-surface p-8 shadow-card text-center min-h-[500px]">
        <div className="rounded-full bg-brand-50 p-4 text-brand-500">
          <BookOpen className="size-8" />
        </div>
        <h3 className="mt-4 text-base font-bold text-app-foreground">영문 업무 명세서 (AI 생성 대기)</h3>
        <p className="mt-2 max-w-md text-xs leading-5 text-app-muted">
          좌측 Form에서 한국어 업무 상세와 마일스톤 DoD를 작성하신 후<br />
          <strong className="text-app-foreground">[AI 영문 명세 생성 (변환)]</strong> 버튼을 누르면 RAG 엔진이 표준 영문 SOW를 자동으로 생성합니다.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6 print:border-none print:shadow-none print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #sow-print-area, #sow-print-area * {
            visibility: visible;
          }
          #sow-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* 헤더 및 버전 표시 */}
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-app-foreground">영어 업무 명세서 (AI 생성)</h2>
            <span className="rounded-pill bg-app-foreground px-2.5 py-0.5 text-xs font-bold text-white">
              v{sow.version}
            </span>
          </div>
          <p className="mt-1 text-xs text-app-muted">
            RAG 기반 IT 표준 용어 매핑 및 B2B 계약 가이드라인에 따른 영문 초안입니다.
          </p>
        </div>
      </div>

      {/* RAG 추출 전문 용어 태그 */}
      {sow.retrievedTerms && sow.retrievedTerms.length > 0 && (
        <div className="mt-4 rounded-control border border-brand-200 bg-brand-50/60 p-3">
          <p className="text-[0.7rem] font-bold text-brand-800 uppercase tracking-wide">
            🔍 RAG 검색으로 정밀 매핑된 표준 용어 ({sow.retrievedTerms.length}건)
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sow.retrievedTerms.map((term, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[0.75rem] font-semibold text-brand-900 shadow-xs border border-brand-200"
              >
                <span>{term?.kr}</span> ➔ <strong className="text-brand-700">{term?.en}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6대 핵심 영문 SOW 섹션 카운터 (Edit Mode) */}
      <div 
        id="sow-print-area"
        ref={sowContentRef}
        contentEditable={isEditingSection}
        suppressContentEditableWarning
        className={`mt-5 space-y-6 rounded-control border p-5 transition-all ${
          isEditingSection 
            ? "border-brand-500 bg-white outline-none ring-2 ring-brand-500/20" 
            : "border-app-border bg-app-surface-subtle print:border-none print:bg-transparent print:p-0"
        }`}
      >
        {/* Template Header */}
        <div className="border-b-2 border-app-foreground pb-4 mb-4">
          <h1 className="text-xl font-black text-app-foreground uppercase mb-4 text-center">STATEMENT OF WORK (SOW)</h1>
          <ul className="space-y-1.5 text-sm font-semibold text-app-foreground">
            <li><strong>Project Name:</strong> {sow.header?.projectName}</li>
            <li className="border-t border-app-border pt-1"><strong>Client:</strong> {sow.header?.client}</li>
            <li className="border-t border-app-border pt-1"><strong>Vendor/Provider:</strong> {sow.header?.vendor}</li>
            <li className="border-t border-app-border pt-1"><strong>Effective Date:</strong> {sow.header?.effectiveDate}</li>
          </ul>
        </div>

        {/* 1. Project Overview & Objectives */}
        <div>
          <h3 className="text-base font-black text-app-foreground border-b border-app-border pb-1">1. Project Overview & Objectives</h3>
          <ul className="mt-2 space-y-1 text-sm text-app-foreground/90 list-disc pl-5">
            <li><strong>Background:</strong> {sow.overview?.background}</li>
            <li><strong>Objective:</strong> {sow.overview?.objective}</li>
          </ul>
        </div>

        {/* 2. Scope of Work */}
        <div>
          <h3 className="text-base font-black text-app-foreground border-b border-app-border pb-1">2. Scope of Work</h3>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-app-foreground">2.1 In-Scope (Included)</h4>
            <ul className="mt-1 space-y-1 text-sm text-app-foreground/90 list-disc pl-5">
              {sow.scopeOfWork?.inScope?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          {sow.scopeOfWork?.outOfScope && sow.scopeOfWork.outOfScope.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-bold text-app-foreground">2.2 Out-of-Scope (Excluded)</h4>
              <ul className="mt-1 space-y-1 text-sm text-app-foreground/90 list-disc pl-5">
                {sow.scopeOfWork?.outOfScope?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3. Milestones */}
        <div>
          <h3 className="text-base font-black text-app-foreground border-b border-app-border pb-1">3. Milestones</h3>
          <div className="mt-3 space-y-3">
            {sow.timelineAndMilestones?.map((m, i) => (
              <div key={i} className="rounded border border-app-border bg-app-surface p-3 print:border-app-foreground">
                <div className="flex items-center justify-between text-sm font-bold text-app-foreground">
                  <span>{m?.code}. {m?.titleEn}</span>
                  <span className="text-brand-700 print:text-app-foreground">{m?.period} · {m?.amount}</span>
                </div>
                {m?.dodsEn && m.dodsEn.length > 0 && (
                  <div className="mt-2 border-t border-app-border/40 pt-2">
                    <span className="text-xs font-bold text-app-muted uppercase">DoD Criteria:</span>
                    <ul className="mt-1 space-y-1 text-xs text-app-foreground/90 list-disc pl-4">
                      {m.dodsEn.map((d, dIdx) => (
                        <li key={dIdx}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Acceptance Criteria & Definition of Done (DoD) */}
        <div>
          <h3 className="text-base font-black text-app-foreground border-b border-app-border pb-1">4. Acceptance Criteria & Definition of Done (DoD)</h3>
          <ul className="mt-2 space-y-2 text-sm text-app-foreground/90 list-disc pl-5">
            <li>
              <strong>Acceptance Criteria:</strong>
              <ul className="mt-1 space-y-1 list-disc pl-5">
                {sow.acceptanceCriteria?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>Definition of Done (DoD):</strong>
              <ul className="mt-1 space-y-1 list-disc pl-5">
                {sow.definitionOfDone?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </li>
          </ul>
        </div>

        {/* 5. Roles & Responsibilities */}
        <div>
          <h3 className="text-base font-black text-app-foreground border-b border-app-border pb-1">5. Roles & Responsibilities (RACI Matrix)</h3>
          <ul className="mt-2 space-y-1 text-sm text-app-foreground/90 list-disc pl-5">
            <li><strong>Client Responsibilities:</strong> {sow.rolesAndResponsibilities?.client}</li>
            <li><strong>Vendor Responsibilities:</strong> {sow.rolesAndResponsibilities?.vendor}</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="mt-8 border-t-2 border-app-border pt-4">
          <h4 className="text-sm font-bold mb-6">Signatures:</h4>
          <div className="flex justify-between gap-8 text-sm">
            <div>
              <p className="mb-8">Client Representative: <span className="inline-block w-40 border-b border-app-foreground"></span></p>
              <p>Date: <span className="inline-block w-32 border-b border-app-foreground"></span></p>
            </div>
            <div>
              <p className="mb-8">Vendor Representative: <span className="inline-block w-40 border-b border-app-foreground"></span></p>
              <p>Date: <span className="inline-block w-32 border-b border-app-foreground"></span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 영문 템플릿 미부합 내용 보기 토글 */}
      <div className="mt-4 no-print">
        <button
          type="button"
          onClick={() => setShowOriginalContrast(!showOriginalContrast)}
          className="flex items-center gap-1 text-xs font-bold text-app-foreground hover:underline"
        >
          <span>영문 템플릿에 부합하지 않는 내용</span>
          {showOriginalContrast ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {showOriginalContrast && (
          <div className="mt-2 rounded-control border border-app-border bg-app-surface-subtle p-3 text-xs text-app-muted">
            <p className="font-semibold text-app-foreground">⚠️ 영문 템플릿에 매핑되지 않은 원문 요청사항:</p>
            {sow.unmappedContent && sow.unmappedContent.length > 0 ? (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {sow.unmappedContent.map((content: string, idx: number) => (
                  <li key={idx} className="leading-5">{content}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 leading-5">모든 한국어 입력 내용이 영문 SOW 템플릿에 완벽하게 반영되었습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 섹션 수정 버튼 그룹 */}
      <div className="mt-4 flex gap-2 no-print">
        <button
          type="button"
          onClick={() => setIsEditingSection(!isEditingSection)}
          className={`flex min-h-9 items-center gap-1.5 rounded-control border px-3 text-xs font-bold transition-colors ${
            isEditingSection 
              ? "border-brand-500 bg-brand-50 text-brand-700" 
              : "border-app-border text-app-foreground hover:bg-app-surface-subtle"
          }`}
        >
          <Edit3 className="size-3.5" />
          {isEditingSection ? "수정 완료" : "섹션 직접 수정"}
        </button>
      </div>

      {/* 한국인 PM 검토 완료 및 최종 승인 하단부 */}
      <div className="mt-6 border-t border-app-border pt-5 no-print">
        <label htmlFor="pm-verify-checkbox" className="flex items-center gap-2 text-xs font-bold text-app-foreground cursor-pointer">
          <input
            id="pm-verify-checkbox"
            type="checkbox"
            checked={isPmVerified}
            onChange={(e) => setIsPmVerified(e.target.checked)}
            className="size-4 rounded border-app-border text-brand-600 focus:ring-brand-500 accent-brand-600"
          />
          <span>한국인 PM 검토 완료</span>
        </label>
        <p className="mt-1.5 flex items-center gap-1 text-[0.75rem] text-app-muted">
          <Check className="size-3.5 text-success" />
          검토 완료 체크 후 승인 요청 버튼이 활성화됩니다.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!isPmVerified}
            onClick={onRequestApproval}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-app-foreground px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="size-4" />
            해외 프리랜서 승인 요청
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-app-border-strong px-4 text-sm font-bold text-app-foreground hover:bg-app-surface-subtle"
          >
            <Download className="size-4" />
            PDF로 인쇄 / 저장
          </button>
        </div>
        <p className="mt-2 text-[0.7rem] text-app-muted">
          승인 요청 시 프리랜서에게 알림 전송 · 양측 승인 완료 시 프로젝트 시작 및 마일스톤 확정 (FR-8)
        </p>
      </div>
    </section>
  );
}
