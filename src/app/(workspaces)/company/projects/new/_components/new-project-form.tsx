"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  FileText,
  Info,
  Paperclip,
  Plus,
  Save,
  Users,
} from "lucide-react";

import { createProjectAction, saveProjectDraftAction } from "@/app/actions/projects";
import { initialCreateProjectFormState } from "@/app/actions/projects-form-state";
import type { BackendResult, ProjectDraftFormData } from "@/lib/backend";
import { ProjectSummaryModal, type ProjectPreview } from "./project-summary-modal";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-control border border-app-border-strong bg-app-surface px-3.5 text-sm text-app-foreground outline-none transition-colors placeholder:text-app-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

const sectionTitleClassName =
  "text-lg font-semibold tracking-tight text-app-foreground";

const steps = [
  { label: "기본 정보", description: "목표와 프로젝트 유형" },
  { label: "요구사항", description: "범위와 결과물" },
  { label: "일정·예산", description: "개발 조건" },
  { label: "모집 설정", description: "지원 마감과 안내" },
] as const;

const FORM_ID = "new-project-form";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  web: "웹 애플리케이션",
  mobile: "모바일 앱",
  saas: "SaaS 플랫폼",
  backend: "API·백엔드",
};

const DRAFT_LABEL: Record<"idle" | "saving" | "saved" | "error", string> = {
  idle: "임시 저장",
  saving: "저장 중...",
  saved: "저장됨",
  error: "저장 실패",
};

function buildPreview(formData: FormData): ProjectPreview {
  const get = (name: string) => String(formData.get(name) ?? "").trim();
  const budget = get("budget");
  const budgetLabel = `$${budget || "0"} (고정 금액)`;

  return {
    title: get("title") || "(제목 없음)",
    projectTypeLabel: PROJECT_TYPE_LABELS[get("projectType")] ?? "미지정",
    technology: get("technology") || "-",
    goal: get("goal") || "-",
    requirements: get("requirements") || "-",
    deliverables: get("deliverables") || "-",
    outOfScope: get("outOfScope") || "-",
    budgetLabel,
    scheduleLabel: `${get("startDate") || "-"} ~ ${get("endDate") || "-"}`,
    recruitmentLabel: `${get("recruitmentStart") || "-"} ~ ${get("applicationDeadline") || "-"}`,
    applicantGuidance: get("applicantGuidance") || "-",
  };
}

function computeStepCompletion(get: (name: string) => string): boolean[] {
  return [
    Boolean(get("title") && get("projectType") && get("goal")),
    Boolean(get("requirements")),
    Boolean(get("startDate") && get("endDate") && get("budget")),
    Boolean(get("recruitmentStart") && get("applicationDeadline")),
  ];
}

export function NewProjectForm({
  initialDraft,
}: {
  initialDraft: BackendResult<ProjectDraftFormData | null>;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialCreateProjectFormState,
  );

  const draft = initialDraft.ok ? (initialDraft.data ?? {}) : {};
  const draftValue = (name: string) => draft[name] ?? "";

  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [stepCompletion, setStepCompletion] = useState<boolean[]>(() =>
    computeStepCompletion(draftValue),
  );
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // 제출이 끝나면(성공/실패 모두) 확인 모달을 닫는다.
  useEffect(() => {
    if (wasPending.current && !isPending) {
      setIsConfirmOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending]);

  // 등록 성공 시 토스트를 잠깐 보여준 뒤 모집 현황으로 이동한다.
  useEffect(() => {
    if (state.status !== "success") return;
    const timer = setTimeout(() => {
      router.push("/company/assessments");
    }, 1600);
    return () => clearTimeout(timer);
  }, [state.status, router]);

  const fieldError = (name: string) => state.fieldErrors[name];

  function handleFormChange() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const get = (name: string) => String(data.get(name) ?? "").trim();
    setStepCompletion(computeStepCompletion(get));
  }

  function handleReviewClick() {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;
    setPreview(buildPreview(new FormData(form)));
    setIsConfirmOpen(true);
  }

  function handleConfirmSubmit() {
    formRef.current?.requestSubmit();
  }

  async function handleSaveDraft() {
    const form = formRef.current;
    if (!form) return;

    setDraftStatus("saving");
    const data = new FormData(form);
    const record: Record<string, string> = {};
    data.forEach((value, key) => {
      if (typeof value === "string") record[key] = value;
    });

    const result = await saveProjectDraftAction(record);
    setDraftStatus(result.ok ? "saved" : "error");
    setTimeout(() => setDraftStatus("idle"), 2500);
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-20">
      <header className="border-b border-app-border pb-6">
        <Link
          href="/company/assessments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-muted transition-colors hover:text-brand-700"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          진행 전 프로젝트
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-app-foreground sm:text-3xl">
              새 프로젝트 만들기
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
              프리랜서가 프로젝트를 이해하고 수행 제안서를 작성할 수 있도록
              목표, 요구사항, 일정과 예산을 정리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={draftStatus === "saving"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-4 text-sm font-semibold text-app-foreground transition-colors hover:bg-app-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save aria-hidden="true" className="size-4" />
              {DRAFT_LABEL[draftStatus]}
            </button>
            <button
              type="button"
              onClick={handleReviewClick}
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              프로젝트 만들기
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {Object.keys(draft).length > 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-card border border-app-border bg-app-surface p-4">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <p className="text-sm text-app-foreground">
            임시 저장된 내용을 불러왔습니다. 이어서 작성해주세요.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-card border border-app-border bg-app-surface p-4 shadow-card lg:sticky lg:top-[calc(var(--app-header-height)+2rem)]">
          <p className="px-2 text-sm font-semibold text-app-foreground">
            작성 순서
          </p>
          <ol className="mt-4 space-y-1">
            {steps.map((step, index) => {
              const isComplete = stepCompletion[index];
              return (
                <li
                  key={step.label}
                  className="flex gap-3 rounded-control p-3"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-control border text-xs ${
                      isComplete
                        ? "border-success text-success"
                        : "border-app-border bg-app-surface-subtle text-app-muted"
                    }`}
                  >
                    {isComplete ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm text-app-foreground">
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-app-muted">
                      {step.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-control border border-app-border bg-app-surface-subtle p-3.5">
            <p className="flex items-center gap-2 text-xs text-app-foreground">
              <Info aria-hidden="true" className="size-4" />
              등록 후 진행
            </p>
            <p className="mt-2 text-xs leading-5 text-app-muted">
              프로젝트는 먼저 모집 상태로 생성됩니다. 프리랜서 선정과 SOW 양측
              승인이 완료되면 진행 프로젝트로 전환됩니다.
            </p>
          </div>
        </aside>

        <form
          id={FORM_ID}
          ref={formRef}
          action={formAction}
          onChange={handleFormChange}
          className="space-y-6"
        >
          {state.status === "error" && state.error ? (
            <div className="flex items-start gap-3 rounded-card border border-app-border bg-app-surface p-4">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
              <p className="text-sm text-app-foreground">오류: {state.error}</p>
            </div>
          ) : null}

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div>
                <h2 className={sectionTitleClassName}>1. 프로젝트 기본 정보</h2>
                <p className="mt-1 text-sm text-app-muted">
                  지원자가 목록에서 가장 먼저 확인하는 정보입니다.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm text-app-foreground">
                프로젝트명 <span className="text-brand-500">*</span>
                <input
                  className={inputClassName}
                  name="title"
                  required
                  defaultValue={draftValue("title")}
                  placeholder="예: B2B 고객 포털 MVP 개발"
                />
                <FieldError message={fieldError("title")} />
              </label>

              <label className="text-sm text-app-foreground">
                프로젝트 유형 <span className="text-brand-500">*</span>
                <select
                  className={inputClassName}
                  name="projectType"
                  required
                  defaultValue={draftValue("projectType")}
                >
                  <option value="" disabled>유형을 선택하세요</option>
                  <option value="web">웹 애플리케이션</option>
                  <option value="mobile">모바일 앱</option>
                  <option value="saas">SaaS 플랫폼</option>
                  <option value="backend">API·백엔드</option>
                </select>
              </label>

              <label className="text-sm text-app-foreground">
                주요 기술 환경
                <input
                  className={inputClassName}
                  name="technology"
                  defaultValue={draftValue("technology")}
                  placeholder="예: Next.js, Node.js, PostgreSQL"
                />
              </label>

              <label className="sm:col-span-2 text-sm text-app-foreground">
                프로젝트 목표 <span className="text-brand-500">*</span>
                <textarea
                  className={`${inputClassName} min-h-32 resize-y py-3`}
                  name="goal"
                  required
                  defaultValue={draftValue("goal")}
                  placeholder="이 프로젝트를 통해 해결하려는 문제와 사용자가 얻게 될 결과를 설명해주세요."
                />
                <span className="mt-2 block text-xs leading-5 text-app-muted">
                  구현 방식보다 비즈니스 목표와 핵심 사용자 경험을 먼저 적어주세요.
                </span>
                <FieldError message={fieldError("goal")} />
              </label>
            </div>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div>
                <h2 className={sectionTitleClassName}>2. 요구사항과 작업 범위</h2>
                <p className="mt-1 text-sm text-app-muted">
                  해야 할 일과 하지 않을 일을 구분해 제안서의 기준을 만듭니다.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <label className="block text-sm text-app-foreground">
                핵심 요구사항 <span className="text-brand-500">*</span>
                <textarea
                  className={`${inputClassName} min-h-44 resize-y py-3`}
                  name="requirements"
                  required
                  defaultValue={draftValue("requirements")}
                  placeholder={"예:\n- 이메일과 비밀번호로 로그인할 수 있어야 합니다.\n- 로그인 후 고객별 대시보드를 확인할 수 있어야 합니다.\n- 운영자가 고객 계정을 관리할 수 있어야 합니다."}
                />
                <FieldError message={fieldError("requirements")} />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="text-sm text-app-foreground">
                  기대 결과물
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y py-3`}
                    name="deliverables"
                    defaultValue={draftValue("deliverables")}
                    placeholder="예: 배포 가능한 웹앱, 소스 코드, 운영 가이드"
                  />
                </label>
                <label className="text-sm text-app-foreground">
                  제외 범위
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y py-3`}
                    name="outOfScope"
                    defaultValue={draftValue("outOfScope")}
                    placeholder="예: 모바일 앱, 결제 연동, 다국어 지원"
                  />
                </label>
              </div>

              <label className="block text-sm text-app-foreground">
                참고자료 링크·메모
                <textarea
                  className={`${inputClassName} min-h-20 resize-y py-3`}
                  name="referenceNotes"
                  defaultValue={draftValue("referenceNotes")}
                  placeholder="예: 디자인 시안 https://... , 기존 API 문서 https://..."
                />
              </label>

              <label className="block text-sm text-app-foreground">
                참고자료 파일
                <span className="mt-2 flex min-h-28 flex-col items-center justify-center rounded-control border border-dashed border-app-border-strong bg-app-surface-subtle px-4 text-center">
                  <Paperclip aria-hidden="true" className="size-5 text-brand-600" />
                  <span className="mt-2 text-sm text-app-foreground">
                    요구사항 문서나 화면 자료 첨부
                  </span>
                  <span className="mt-1 text-xs text-app-muted">
                    PDF, DOCX, PNG, JPG, WebP, TXT · 최대 20MB
                  </span>
                  <input
                    name="attachment"
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt"
                    className="mt-3 max-w-full text-xs text-app-muted file:mr-3 file:rounded-control file:border-0 file:bg-brand-50 file:px-3 file:py-2 file: file:text-brand-700"
                  />
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <CircleDollarSign aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div>
                <h2 className={sectionTitleClassName}>3. 일정과 예산</h2>
                <p className="mt-1 text-sm text-app-muted">
                  제안서에서 일정과 수행 방식을 판단할 수 있는 조건을 입력합니다.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="text-sm text-app-foreground">
                희망 시작일 <span className="text-brand-500">*</span>
                <input
                  className={inputClassName}
                  type="date"
                  name="startDate"
                  required
                  defaultValue={draftValue("startDate")}
                />
                <FieldError message={fieldError("startDate")} />
              </label>
              <label className="text-sm text-app-foreground">
                희망 완료일 <span className="text-brand-500">*</span>
                <input
                  className={inputClassName}
                  type="date"
                  name="endDate"
                  required
                  defaultValue={draftValue("endDate")}
                />
                <FieldError message={fieldError("endDate")} />
              </label>
              <label className="text-sm text-app-foreground">
                예산 <span className="text-brand-500">*</span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-sm text-app-muted">
                    $
                  </span>
                  <input
                    className={`${inputClassName} pl-8`}
                    inputMode="numeric"
                    name="budget"
                    required
                    defaultValue={draftValue("budget")}
                    placeholder="12,000"
                  />
                </span>
                <FieldError message={fieldError("budgetAmount")} />
              </label>
            </div>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <Users aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div>
                <h2 className={sectionTitleClassName}>4. 프리랜서 모집 설정</h2>
                <p className="mt-1 text-sm text-app-muted">
                  프로젝트 공개 기간과 지원자에게 전달할 추가 안내를 설정합니다.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="text-sm text-app-foreground">
                모집 시작일 <span className="text-brand-500">*</span>
                <span className="relative block">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 mt-1 size-4 -translate-y-1/2 text-app-muted"
                  />
                  <input
                    className={`${inputClassName} pl-10`}
                    type="date"
                    name="recruitmentStart"
                    required
                    defaultValue={draftValue("recruitmentStart")}
                  />
                </span>
                <FieldError message={fieldError("recruitmentStartAt")} />
              </label>
              <label className="text-sm text-app-foreground">
                지원 마감일 <span className="text-brand-500">*</span>
                <span className="relative block">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 mt-1 size-4 -translate-y-1/2 text-app-muted"
                  />
                  <input
                    className={`${inputClassName} pl-10`}
                    type="date"
                    name="applicationDeadline"
                    required
                    defaultValue={draftValue("applicationDeadline")}
                  />
                </span>
                <FieldError message={fieldError("recruitmentEndAt")} />
              </label>
              <label className="sm:col-span-2 text-sm text-app-foreground">
                지원자에게 전달할 안내
                <textarea
                  className={`${inputClassName} min-h-28 resize-y py-3`}
                  name="applicantGuidance"
                  defaultValue={draftValue("applicantGuidance")}
                  placeholder="제안서에 포함하면 좋은 내용이나 협업 시 중요하게 보는 기준을 안내해주세요. 고정된 답변 형식은 강제하지 않습니다."
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-app-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/company/assessments"
              className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-semibold text-app-muted transition-colors hover:bg-app-surface-subtle hover:text-app-foreground"
            >
              취소
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={draftStatus === "saving"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-5 text-sm font-semibold text-app-foreground transition-colors hover:bg-app-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save aria-hidden="true" className="size-4" />
                {DRAFT_LABEL[draftStatus]}
              </button>
              <button
                type="button"
                onClick={handleReviewClick}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus aria-hidden="true" className="size-4" />
                프로젝트 만들기
              </button>
            </div>
          </div>
        </form>
      </div>

      <ProjectSummaryModal
        open={isConfirmOpen}
        data={preview}
        isSubmitting={isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />

      {state.status === "success" ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-control bg-app-foreground px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-400" />
          {state.warning ? `공고는 등록됐지만 첨부 실패: ${state.warning}` : "공고가 성공적으로 등록되었습니다."}
        </div>
      ) : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1.5 block text-xs text-red-600">{message}</span>;
}
