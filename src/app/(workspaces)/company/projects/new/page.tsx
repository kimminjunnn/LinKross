import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Info,
  Paperclip,
  Plus,
  Rocket,
  Save,
  Users,
} from "lucide-react";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-control border border-app-border-strong bg-app-surface px-3.5 text-sm text-app-foreground outline-none transition-colors placeholder:text-app-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

const sectionTitleClassName =
  "text-lg font-black tracking-tight text-app-foreground";

const steps = [
  { label: "기본 정보", description: "목표와 프로젝트 유형" },
  { label: "요구사항", description: "범위와 결과물" },
  { label: "일정·예산", description: "개발 조건" },
  { label: "모집 설정", description: "지원 마감과 안내" },
] as const;

export default function NewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-7xl pb-20">
      <header className="border-b border-app-border pb-6">
        <Link
          href="/company/assessments"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-app-muted transition-colors hover:text-brand-700"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          진행 전 프로젝트
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
              <Rocket aria-hidden="true" className="size-3.5" />
              프로젝트 등록
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-app-foreground sm:text-3xl">
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-4 text-sm font-bold text-app-foreground transition-colors hover:bg-app-surface-subtle"
            >
              <Save aria-hidden="true" className="size-4" />
              임시 저장
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white shadow-sm transition-colors hover:bg-brand-600"
            >
              프로젝트 만들기
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-card border border-app-border bg-app-surface p-4 shadow-card lg:sticky lg:top-[calc(var(--app-header-height)+2rem)]">
          <p className="px-2 text-xs font-black tracking-[0.12em] text-app-muted uppercase">
            작성 순서
          </p>
          <ol className="mt-4 space-y-1">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className={`flex gap-3 rounded-xl p-3 ${
                  index === 0 ? "bg-brand-50" : ""
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                    index === 0
                      ? "bg-brand-500 text-white"
                      : "bg-app-surface-subtle text-app-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-black text-app-foreground">
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-app-muted">
                    {step.description}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-xl border border-accent-200 bg-accent-50 p-3.5">
            <p className="flex items-center gap-2 text-xs font-black text-accent-800">
              <Info aria-hidden="true" className="size-4" />
              등록 후 진행
            </p>
            <p className="mt-2 text-xs leading-5 text-accent-800/80">
              프로젝트는 먼저 모집 상태로 생성됩니다. 프리랜서 선정과 SOW 양측
              승인이 완료되면 진행 프로젝트로 전환됩니다.
            </p>
          </div>
        </aside>

        <form className="space-y-6">
          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <FileText aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className={sectionTitleClassName}>1. 프로젝트 기본 정보</h2>
                <p className="mt-1 text-sm text-app-muted">
                  지원자가 목록에서 가장 먼저 확인하는 정보입니다.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-bold text-app-foreground">
                프로젝트명 <span className="text-brand-500">*</span>
                <input
                  className={inputClassName}
                  name="title"
                  placeholder="예: B2B 고객 포털 MVP 개발"
                />
              </label>

              <label className="text-sm font-bold text-app-foreground">
                프로젝트 유형 <span className="text-brand-500">*</span>
                <select className={inputClassName} name="projectType" defaultValue="">
                  <option value="" disabled>유형을 선택하세요</option>
                  <option value="web">웹 애플리케이션</option>
                  <option value="mobile">모바일 앱</option>
                  <option value="saas">SaaS 플랫폼</option>
                  <option value="backend">API·백엔드</option>
                </select>
              </label>

              <label className="text-sm font-bold text-app-foreground">
                주요 기술 환경
                <input
                  className={inputClassName}
                  name="technology"
                  placeholder="예: Next.js, Node.js, PostgreSQL"
                />
              </label>

              <label className="sm:col-span-2 text-sm font-bold text-app-foreground">
                프로젝트 목표 <span className="text-brand-500">*</span>
                <textarea
                  className={`${inputClassName} min-h-32 resize-y py-3`}
                  name="goal"
                  placeholder="이 프로젝트를 통해 해결하려는 문제와 사용자가 얻게 될 결과를 설명해주세요."
                />
                <span className="mt-2 block text-xs font-normal leading-5 text-app-muted">
                  구현 방식보다 비즈니스 목표와 핵심 사용자 경험을 먼저 적어주세요.
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <CheckCircle2 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className={sectionTitleClassName}>2. 요구사항과 작업 범위</h2>
                <p className="mt-1 text-sm text-app-muted">
                  해야 할 일과 하지 않을 일을 구분해 제안서의 기준을 만듭니다.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <label className="block text-sm font-bold text-app-foreground">
                핵심 요구사항 <span className="text-brand-500">*</span>
                <textarea
                  className={`${inputClassName} min-h-44 resize-y py-3`}
                  name="requirements"
                  placeholder={"예:\n- 이메일과 비밀번호로 로그인할 수 있어야 합니다.\n- 로그인 후 고객별 대시보드를 확인할 수 있어야 합니다.\n- 운영자가 고객 계정을 관리할 수 있어야 합니다."}
                />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="text-sm font-bold text-app-foreground">
                  기대 결과물
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y py-3`}
                    name="deliverables"
                    placeholder="예: 배포 가능한 웹앱, 소스 코드, 운영 가이드"
                  />
                </label>
                <label className="text-sm font-bold text-app-foreground">
                  제외 범위
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y py-3`}
                    name="outOfScope"
                    placeholder="예: 모바일 앱, 결제 연동, 다국어 지원"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-app-foreground">
                참고자료
                <span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-app-border-strong bg-app-surface-subtle px-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50">
                  <Paperclip aria-hidden="true" className="size-5 text-brand-600" />
                  <span className="mt-2 text-sm font-black text-app-foreground">
                    요구사항 문서나 화면 자료 첨부
                  </span>
                  <span className="mt-1 text-xs font-normal text-app-muted">
                    PDF, DOCX, PNG, JPG · 파일당 최대 20MB
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    name="references"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <CircleDollarSign aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className={sectionTitleClassName}>3. 일정과 예산</h2>
                <p className="mt-1 text-sm text-app-muted">
                  제안서에서 일정과 수행 방식을 판단할 수 있는 조건을 입력합니다.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="text-sm font-bold text-app-foreground">
                희망 시작일 <span className="text-brand-500">*</span>
                <input className={inputClassName} type="date" name="startDate" />
              </label>
              <label className="text-sm font-bold text-app-foreground">
                희망 완료일 <span className="text-brand-500">*</span>
                <input className={inputClassName} type="date" name="endDate" />
              </label>
              <label className="text-sm font-bold text-app-foreground">
                예산 <span className="text-brand-500">*</span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-sm font-bold text-app-muted">
                    $
                  </span>
                  <input
                    className={`${inputClassName} pl-8`}
                    inputMode="numeric"
                    name="budget"
                    placeholder="12,000"
                  />
                </span>
              </label>
              <label className="text-sm font-bold text-app-foreground">
                예산 방식
                <select className={inputClassName} name="budgetType" defaultValue="fixed">
                  <option value="fixed">프로젝트 고정 금액</option>
                  <option value="range">협의 가능한 범위</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3 border-b border-app-border pb-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className={sectionTitleClassName}>4. 프리랜서 모집 설정</h2>
                <p className="mt-1 text-sm text-app-muted">
                  프로젝트 공개 기간과 지원자에게 전달할 추가 안내를 설정합니다.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="text-sm font-bold text-app-foreground">
                모집 시작일 <span className="text-brand-500">*</span>
                <span className="relative block">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 mt-1 size-4 -translate-y-1/2 text-app-muted"
                  />
                  <input className={`${inputClassName} pl-10`} type="date" name="recruitmentStart" />
                </span>
              </label>
              <label className="text-sm font-bold text-app-foreground">
                지원 마감일 <span className="text-brand-500">*</span>
                <span className="relative block">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 mt-1 size-4 -translate-y-1/2 text-app-muted"
                  />
                  <input className={`${inputClassName} pl-10`} type="date" name="applicationDeadline" />
                </span>
              </label>
              <label className="sm:col-span-2 text-sm font-bold text-app-foreground">
                지원자에게 전달할 안내
                <textarea
                  className={`${inputClassName} min-h-28 resize-y py-3`}
                  name="applicantGuidance"
                  placeholder="제안서에 포함하면 좋은 내용이나 협업 시 중요하게 보는 기준을 안내해주세요. 고정된 답변 형식은 강제하지 않습니다."
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-app-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/company/assessments"
              className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-bold text-app-muted transition-colors hover:bg-app-surface-subtle hover:text-app-foreground"
            >
              취소
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong bg-app-surface px-5 text-sm font-bold text-app-foreground transition-colors hover:bg-app-surface-subtle"
              >
                <Save aria-hidden="true" className="size-4" />
                임시 저장
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-6 text-sm font-black text-white shadow-sm transition-colors hover:bg-brand-600"
              >
                <Plus aria-hidden="true" className="size-4" />
                프로젝트 만들기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
