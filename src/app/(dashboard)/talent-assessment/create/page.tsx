"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Briefcase,
  FileCheck,
  Check,
  Percent,
} from "lucide-react";
import {
  saveAssessment,
  generateAssessmentId,
  TalentAssessment,
  UploadedFile,
} from "@/lib/assessments";

export default function CreateTalentAssessmentPage() {
  const router = useRouter();

  // Section 1: Project Information State
  const [projectName, setProjectName] = useState("쇼핑몰 MVP 개발");
  const [projectType, setProjectType] = useState("Web Application");
  const [budget, setBudget] = useState("$5,000");
  const [devPeriod, setDevPeriod] = useState("8주");

  // Section 2: Document Upload State
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>({
    name: "프로젝트_쇼핑몰_MVP_요구사항.pdf",
    size: "2.4 MB",
    type: "application/pdf",
    status: "completed",
    uploadedAt: new Date().toISOString().split("T")[0],
  });
  const [isDragging, setIsDragging] = useState(false);

  // Section 3: Time Limit State
  const [timeLimit, setTimeLimit] = useState("60분");

  // Section 4: Required Responses State (All selected by default)
  const [requiredResponses, setRequiredResponses] = useState({
    questions: true,
    summary: true,
    plan: true,
    risk: true,
  });

  // Section 5: Evaluation Criteria State (25% each by default = 100%)
  const [criteria, setCriteria] = useState({
    requirements: 25,
    questions: 25,
    workPlan: 25,
    riskMitigation: 25,
  });

  // Form Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total weight
  const totalWeight =
    Number(criteria.requirements || 0) +
    Number(criteria.questions || 0) +
    Number(criteria.workPlan || 0) +
    Number(criteria.riskMitigation || 0);

  const isWeightValid = totalWeight === 100;

  // Show Toast helper
  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      showToast("PDF 또는 DOCX 형식의 파일만 업로드할 수 있습니다.", "error");
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    setUploadedFile({
      name: file.name,
      size: sizeMb,
      type: file.type || ext,
      status: "completed",
      uploadedAt: new Date().toISOString().split("T")[0],
    });
    showToast(`'${file.name}' 파일이 등록되었습니다.`, "success");
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    showToast("요구사항 문서가 삭제되었습니다.", "info");
  };

  // Toggle Checkbox Cards
  const toggleRequiredResponse = (key: keyof typeof requiredResponses) => {
    setRequiredResponses((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Update Evaluation Criteria Weight
  const handleCriteriaChange = (key: keyof typeof criteria, val: string) => {
    const numVal = parseInt(val, 10);
    const safeVal = isNaN(numVal) ? 0 : Math.max(0, Math.min(100, numVal));
    setCriteria((prev) => ({
      ...prev,
      [key]: safeVal,
    }));
  };

  // Validation Check
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!projectName.trim()) {
      newErrors.projectName = "프로젝트 이름을 입력해주세요.";
    }
    if (!projectType.trim()) {
      newErrors.projectType = "프로젝트 유형을 입력해주세요.";
    }
    if (!budget.trim()) {
      newErrors.budget = "예산을 입력해주세요.";
    }
    if (!devPeriod.trim()) {
      newErrors.devPeriod = "개발 기간을 입력해주세요.";
    }
    if (!uploadedFile) {
      newErrors.document = "요구사항 문서를 업로드해주세요.";
    }
    if (!isWeightValid) {
      newErrors.criteria = `평가 가중치 합계는 100점이어야 합니다. (현재: ${totalWeight}점)`;
    }

    const selectedResponseCount = Object.values(requiredResponses).filter(Boolean).length;
    if (selectedResponseCount === 0) {
      newErrors.responses = "최소 1개 이상의 필수 답변 항목을 선택해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Action: Save Draft (임시 저장)
  const handleSaveDraft = () => {
    showToast("과제 설정이 임시 저장되었습니다.", "success");
  };

  // Action: Publish Assessment (과제 등록하기)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      if (!isWeightValid) {
        showToast(`평가 가중치의 합이 100점이어야 합니다. (현재: ${totalWeight}점)`, "error");
      } else {
        showToast("입력항목을 확인해주세요.", "error");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const assessmentId = generateAssessmentId();

      const newAssessment: TalentAssessment = {
        id: assessmentId,
        projectName,
        projectType,
        budget,
        devPeriod,
        document: uploadedFile,
        timeLimit,
        requiredResponses,
        evaluationCriteria: criteria,
        status: "active",
        createdAt: new Date().toISOString(),
        applicantCount: 0,
      };

      // Mock DB save with slight artificial delay for loading experience
      await new Promise((resolve) => setTimeout(resolve, 800));

      saveAssessment(newAssessment);
      showToast("인재 역량검증 과제가 성공적으로 등록되었습니다!", "success");

      // Navigate to /talent-assessment/:assessmentId
      router.push(`/talent-assessment/${assessmentId}`);
    } catch (err) {
      console.error(err);
      showToast("과제 등록 중 오류가 발생했습니다.", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 ${
            toastMessage.type === "success"
              ? "bg-emerald-900 text-white border border-emerald-700"
              : toastMessage.type === "error"
              ? "bg-rose-900 text-white border border-rose-700"
              : "bg-slate-900 text-white border border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          {toastMessage.type === "error" && <ShieldAlert className="h-5 w-5 text-rose-400" />}
          {toastMessage.type === "info" && <Sparkles className="h-5 w-5 text-brand-400" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="border-b border-app-border pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" /> Pre-verification Step 1
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-app-foreground sm:text-3xl">
          인재 역량검증 과제 등록
        </h1>
        <p className="mt-2 text-base text-app-muted">
          지원자의 실무 대응력을 검증하기 위한 사전 과제를 설정하세요.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Section 1 — Project Information */}
        <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 font-semibold">
              1
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-foreground">Section 1 — 프로젝트 기본 정보</h2>
              <p className="text-xs text-app-muted">과제와 연결할 기본 프로젝트 스펙을 확인 및 입력하세요.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Project Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-app-foreground mb-2">
                프로젝트명 <span className="text-brand-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 쇼핑몰 MVP 개발"
                className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-foreground placeholder-app-muted focus:border-brand-500 focus:outline-none transition-colors"
                required
              />
              {errors.projectName && (
                <p className="mt-1 text-xs text-rose-500">{errors.projectName}</p>
              )}
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-app-foreground mb-2">
                프로젝트 유형 <span className="text-brand-500">*</span>
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-foreground focus:border-brand-500 focus:outline-none transition-colors"
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile App (iOS/Android)">Mobile App (iOS/Android)</option>
                <option value="SaaS / Web Platform">SaaS / Web Platform</option>
                <option value="API & Backend Service">API & Backend Service</option>
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-app-foreground mb-2">
                예산 범위 <span className="text-brand-500">*</span>
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$5,000"
                className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-foreground placeholder-app-muted focus:border-brand-500 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Development Period */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-app-foreground mb-2">
                개발 기간 <span className="text-brand-500">*</span>
              </label>
              <input
                type="text"
                value={devPeriod}
                onChange={(e) => setDevPeriod(e.target.value)}
                placeholder="예: 8주"
                className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-foreground placeholder-app-muted focus:border-brand-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </section>

        {/* Section 2 — Requirements Document */}
        <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 font-semibold">
              2
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-foreground">Section 2 — 요구사항 문서</h2>
              <p className="text-xs text-app-muted">지원자가 검토하고 분석할 과제 기준 요구사항 문서를 첨부하세요 (PDF, DOCX).</p>
            </div>
          </div>

          {uploadedFile ? (
            /* Uploaded File Display Card */
            <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-surface-subtle p-4 sm:p-5 transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-sm text-app-foreground">
                      {uploadedFile.name}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> 업로드 완료
                    </span>
                  </div>
                  <p className="text-xs text-app-muted mt-1">
                    용량: {uploadedFile.size} • 형식: PDF • 등록일: {uploadedFile.uploadedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-app-border text-app-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="파일 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-brand-500 bg-brand-50/50"
                    : "border-app-border bg-app-surface-subtle hover:border-brand-300 hover:bg-app-surface"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileInput}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-app-border text-brand-500 mb-3">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-app-foreground">
                  클릭하여 요구사항 문서를 업로드하거나 파일 드래그 앤 드롭
                </p>
                <p className="text-xs text-app-muted mt-1">
                  지원 가능한 포맷: <strong className="text-app-foreground font-medium">PDF, DOCX</strong> (최대 20MB)
                </p>
              </div>
              {errors.document && (
                <p className="mt-2 text-xs text-rose-500">{errors.document}</p>
              )}
            </div>
          )}
        </section>

        {/* Section 3 — Time Limit */}
        <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 font-semibold">
              3
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-foreground">Section 3 — 작성 제한시간 설정</h2>
              <p className="text-xs text-app-muted">지원자가 요구사항 문서를 읽고 답변을 작성할 제한시간을 지정합니다.</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <label className="block text-sm font-medium text-app-foreground">
              제한시간 (Time Limit)
            </label>
            <div className="relative">
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-foreground focus:border-brand-500 focus:outline-none transition-colors appearance-none pr-10"
              >
                <option value="30분">30분</option>
                <option value="45분">45분</option>
                <option value="60분">60분 (기본 권장)</option>
                <option value="90분">90분</option>
                <option value="120분">120분</option>
              </select>
              <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-app-muted" />
            </div>

            {/* Warning Display */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-medium">
                제출 시간이 종료되면 지원자의 답변 작성이 제한됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 — Required Responses */}
        <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-app-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 font-semibold">
                4
              </div>
              <div>
                <h2 className="text-lg font-semibold text-app-foreground">Section 4 — 필수 제출 항목</h2>
                <p className="text-xs text-app-muted">지원자가 역량검증 응답 시 필수 작성해야 할 4가지 카테고리입니다.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              4 / 4개 기본 선택됨
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card 1: 확인 질문 */}
            <div
              onClick={() => toggleRequiredResponse("questions")}
              className={`cursor-pointer rounded-xl border p-5 transition-all flex items-start gap-4 ${
                requiredResponses.questions
                  ? "border-brand-500 bg-brand-50/30 ring-1 ring-brand-500/20"
                  : "border-app-border bg-app-surface hover:border-app-border-strong"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  requiredResponses.questions
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-app-border bg-white"
                }`}
              >
                {requiredResponses.questions && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-brand-500" />
                  <h3 className="font-semibold text-sm text-app-foreground">1. 확인 질문</h3>
                </div>
                <p className="mt-1 text-xs text-app-muted leading-relaxed">
                  요구사항 문서 분석 후 모호하거나 추가 확인이 필요한 핵심 사안 3-5개를 역으로 질의합니다.
                </p>
              </div>
            </div>

            {/* Card 2: 요구사항 이해 요약 */}
            <div
              onClick={() => toggleRequiredResponse("summary")}
              className={`cursor-pointer rounded-xl border p-5 transition-all flex items-start gap-4 ${
                requiredResponses.summary
                  ? "border-brand-500 bg-brand-50/30 ring-1 ring-brand-500/20"
                  : "border-app-border bg-app-surface hover:border-app-border-strong"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  requiredResponses.summary
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-app-border bg-white"
                }`}
              >
                {requiredResponses.summary && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-brand-500" />
                  <h3 className="font-semibold text-sm text-app-foreground">2. 요구사항 이해 요약</h3>
                </div>
                <p className="mt-1 text-xs text-app-muted leading-relaxed">
                  발주자가 전달한 프로젝트 목적과 핵심 기능 명세를 지원자 언어로 정확하게 재정의합니다.
                </p>
              </div>
            </div>

            {/* Card 3: 실행 계획 */}
            <div
              onClick={() => toggleRequiredResponse("plan")}
              className={`cursor-pointer rounded-xl border p-5 transition-all flex items-start gap-4 ${
                requiredResponses.plan
                  ? "border-brand-500 bg-brand-50/30 ring-1 ring-brand-500/20"
                  : "border-app-border bg-app-surface hover:border-app-border-strong"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  requiredResponses.plan
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-app-border bg-white"
                }`}
              >
                {requiredResponses.plan && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-500" />
                  <h3 className="font-semibold text-sm text-app-foreground">3. 실행 계획</h3>
                </div>
                <p className="mt-1 text-xs text-app-muted leading-relaxed">
                  주차별 개발 마일스톤, 사용 기술 스택, 시스템 아키텍처 및 단계별 로드맵을 제출합니다.
                </p>
              </div>
            </div>

            {/* Card 4: 예상 리스크 및 대응방안 */}
            <div
              onClick={() => toggleRequiredResponse("risk")}
              className={`cursor-pointer rounded-xl border p-5 transition-all flex items-start gap-4 ${
                requiredResponses.risk
                  ? "border-brand-500 bg-brand-50/30 ring-1 ring-brand-500/20"
                  : "border-app-border bg-app-surface hover:border-app-border-strong"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  requiredResponses.risk
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-app-border bg-white"
                }`}
              >
                {requiredResponses.risk && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-brand-500" />
                  <h3 className="font-semibold text-sm text-app-foreground">4. 예상 리스크 및 대응방안</h3>
                </div>
                <p className="mt-1 text-xs text-app-muted leading-relaxed">
                  기술적 난제, 외부 연동 이슈, 일정 지연 요소를 사전 식별하고 구체적 방안을 제안합니다.
                </p>
              </div>
            </div>
          </div>
          {errors.responses && (
            <p className="mt-3 text-xs text-rose-500">{errors.responses}</p>
          )}
        </section>

        {/* Section 5 — Evaluation Criteria */}
        <section className="rounded-[var(--radius-card)] border border-app-border bg-app-surface p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-app-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 font-semibold">
                5
              </div>
              <div>
                <h2 className="text-lg font-semibold text-app-foreground">Section 5 — 평가 루브릭 가중치 설정</h2>
                <p className="text-xs text-app-muted">AI 및 발주자 종합 평가 시 반영할 4개 항목의 비중을 설정하세요.</p>
              </div>
            </div>
            
            {/* Total Weight Indicator */}
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border transition-colors ${
                isWeightValid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              <Percent className="h-4 w-4" />
              <span>총점 {totalWeight} / 100점</span>
              {isWeightValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 ml-1" />
              )}
            </div>
          </div>

          {!isWeightValid && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <p className="text-xs font-semibold">
                가중치의 합계는 정확히 100점이어야 합니다. (현재 합계: {totalWeight}점)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Requirements Understanding */}
            <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-app-foreground flex items-center gap-1.5">
                  Requirements Understanding <span className="text-xs text-app-muted font-normal">(요구사항 이해)</span>
                </label>
                <span className="text-sm font-bold text-brand-600">{criteria.requirements}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={criteria.requirements}
                  onChange={(e) => handleCriteriaChange("requirements", e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criteria.requirements}
                  onChange={(e) => handleCriteriaChange("requirements", e.target.value)}
                  className="w-16 rounded-lg border border-app-border bg-white px-2 py-1 text-center text-sm font-bold text-app-foreground"
                />
              </div>
            </div>

            {/* Clarifying Questions */}
            <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-app-foreground flex items-center gap-1.5">
                  Clarifying Questions <span className="text-xs text-app-muted font-normal">(확인 질문)</span>
                </label>
                <span className="text-sm font-bold text-brand-600">{criteria.questions}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={criteria.questions}
                  onChange={(e) => handleCriteriaChange("questions", e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criteria.questions}
                  onChange={(e) => handleCriteriaChange("questions", e.target.value)}
                  className="w-16 rounded-lg border border-app-border bg-white px-2 py-1 text-center text-sm font-bold text-app-foreground"
                />
              </div>
            </div>

            {/* Work Plan */}
            <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-app-foreground flex items-center gap-1.5">
                  Work Plan <span className="text-xs text-app-muted font-normal">(실행 계획)</span>
                </label>
                <span className="text-sm font-bold text-brand-600">{criteria.workPlan}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={criteria.workPlan}
                  onChange={(e) => handleCriteriaChange("workPlan", e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criteria.workPlan}
                  onChange={(e) => handleCriteriaChange("workPlan", e.target.value)}
                  className="w-16 rounded-lg border border-app-border bg-white px-2 py-1 text-center text-sm font-bold text-app-foreground"
                />
              </div>
            </div>

            {/* Risk & Mitigation */}
            <div className="rounded-xl border border-app-border p-4 bg-app-surface-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-app-foreground flex items-center gap-1.5">
                  Risk & Mitigation <span className="text-xs text-app-muted font-normal">(리스크 및 대응)</span>
                </label>
                <span className="text-sm font-bold text-brand-600">{criteria.riskMitigation}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={criteria.riskMitigation}
                  onChange={(e) => handleCriteriaChange("riskMitigation", e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criteria.riskMitigation}
                  onChange={(e) => handleCriteriaChange("riskMitigation", e.target.value)}
                  className="w-16 rounded-lg border border-app-border bg-white px-2 py-1 text-center text-sm font-bold text-app-foreground"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Actions Area */}
        <div className="sticky bottom-4 z-40 flex items-center justify-between rounded-2xl border border-app-border bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-app-border bg-app-surface px-5 py-3 text-sm font-medium text-app-foreground hover:bg-app-surface-subtle transition-colors"
          >
            <Save className="h-4 w-4 text-app-muted" />
            임시 저장
          </button>

          <div className="flex items-center gap-3">
            {!isWeightValid && (
              <span className="hidden sm:inline-block text-xs font-semibold text-rose-600">
                ⚠️ 가중치 합계(100점)를 먼저 조정해주세요
              </span>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !isWeightValid}
              className={`inline-flex items-center gap-2 rounded-[var(--radius-control)] px-7 py-3 text-sm font-semibold text-white shadow-md transition-all ${
                isSubmitting || !isWeightValid
                  ? "bg-slate-300 cursor-not-allowed opacity-70"
                  : "bg-brand-500 hover:bg-brand-600 active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  과제 등록 중...
                </>
              ) : (
                <>
                  과제 등록하기
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
