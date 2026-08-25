"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Code2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  type PendingOnboardingProfile,
} from "@/lib/onboarding-storage";

type OnboardingIntent = "recruit" | "apply";
type OnboardingStep = "purpose" | "profile";

const intentOptions = [
  {
    id: "recruit" as const,
    eyebrow: "프로젝트 의뢰",
    title: "개발자를 모집하고 싶어요",
    description:
      "프로젝트의 목표와 요구사항을 등록하고 수행 제안서를 받아보세요.",
    action: "프로젝트 등록 시작",
    icon: BriefcaseBusiness,
  },
  {
    id: "apply" as const,
    eyebrow: "Freelancer · Developer",
    title: "I want to apply for a project",
    description:
      "Explore open projects and propose your approach, timeline, and delivery plan.",
    action: "Get ready to apply",
    icon: Code2,
  },
] as const;

const fieldClassName =
  "mt-2 min-h-12 w-full rounded-control border border-app-border-strong bg-app-surface px-3.5 text-sm text-app-foreground placeholder:text-app-muted/65 transition-colors hover:border-app-muted focus:border-brand-500 focus:outline-none";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("purpose");
  const [intent, setIntent] = useState<OnboardingIntent | null>(null);

  const selectedOption = intentOptions.find((option) => option.id === intent);
  const SelectedIcon = selectedOption?.icon;
  const stepNumber = step === "purpose" ? 1 : 2;
  const isApplicantProfile = step === "profile" && intent === "apply";

  function continueToProfile() {
    if (intent) {
      setStep("profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const isRecruiter = intent === "recruit";
    const role = isRecruiter ? "company" : "freelancer";

    const pendingProfile: PendingOnboardingProfile = isRecruiter
      ? {
          role: "company",
          data: {
            organization_name: String(formData.get("organizationName") ?? ""),
            contact_name: String(formData.get("contactName") ?? ""),
            contact_role: String(formData.get("role") ?? ""),
            team_size: String(formData.get("teamSize") ?? ""),
            website: (formData.get("website") as string) || null,
          },
        }
      : {
          role: "freelancer",
          data: {
            display_name: String(formData.get("displayName") ?? ""),
            timezone: String(formData.get("timezone") ?? ""),
            headline: String(formData.get("headline") ?? ""),
            skills: String(formData.get("skills") ?? ""),
            portfolio_urls: formData
              .getAll("portfolioUrls")
              .map((value) => String(value).trim())
              .filter((value) => value.length > 0),
          },
        };

    // 아직 로그인 전이라 Supabase에 바로 못 쓴다. 로그인 완료 후 첫 화면에서
    // OnboardingProfileSync가 이 값을 읽어 company_profiles/freelancer_profiles에 저장한다.
    sessionStorage.setItem(ONBOARDING_PROFILE_STORAGE_KEY, JSON.stringify(pendingProfile));

    const nextPath = isRecruiter
      ? "/company/projects?onboarding=recruit"
      : "/freelancer/applications?onboarding=apply";
    const loginParams = new URLSearchParams({ role, next: nextPath });

    router.push(`/login?${loginParams.toString()}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-app-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.13),transparent_38%),radial-gradient(circle_at_top_right,rgba(22,155,161,0.12),transparent_34%)]"
      />

      <header className="relative z-10 border-b border-app-border/80 bg-app-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Link
            href={
              intent === "apply"
                ? "/opportunities"
                : intent === "recruit"
                  ? "/login?role=company&next=/company"
                  : "/"
            }
            className="rounded-control px-3 py-2 text-sm font-bold text-app-muted transition-colors hover:bg-app-surface-subtle hover:text-app-foreground"
          >
            {isApplicantProfile ? "Skip for now" : "나중에 하기"}
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-brand-700 uppercase">
                {isApplicantProfile ? "Getting started" : "시작하기"}
              </p>
              <p className="mt-1 text-sm font-bold text-app-foreground">
                {isApplicantProfile ? `Step ${stepNumber} of 2` : `${stepNumber}/2 단계`}
              </p>
            </div>
            <div
              className="flex w-28 gap-2 sm:w-40"
              aria-label={
                isApplicantProfile
                  ? `Onboarding step ${stepNumber} of 2`
                  : `온보딩 ${stepNumber}/2 단계`
              }
            >
              {[1, 2].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-pill transition-colors ${
                    item <= stepNumber ? "bg-brand-500" : "bg-app-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === "purpose" ? (
            <section aria-labelledby="onboarding-purpose-title">
              <div className="max-w-2xl">
                <h1
                  id="onboarding-purpose-title"
                  className="text-3xl font-black tracking-[-0.04em] text-app-foreground sm:text-4xl"
                >
                  LinKross에서 어떤 일을 시작하시나요?
                </h1>
                <p className="mt-4 text-base leading-7 text-app-muted sm:text-lg">
                  개발 프로젝트를 등록하거나, 모집 중인 프로젝트에 지원할 수
                  있습니다.
                </p>
              </div>

              <div
                className="mt-8 grid gap-5 md:grid-cols-2"
                role="radiogroup"
                aria-label="이용 목적"
              >
                {intentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = intent === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setIntent(option.id)}
                      className={`group relative min-h-[17.5rem] rounded-2xl border-2 bg-app-surface p-6 text-left shadow-xs hover:cursor-pointer transition-all duration-300 sm:p-7 ${
                        isSelected
                          ? "border-brand-500 ring-2 ring-brand-500/10 bg-brand-50/5 shadow-xs"
                          : "border-slate-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-slate-50/30 hover:shadow-md"
                      }`}
                    >
                      {/* Styled Icon Container */}
                      <span
                        className={`grid size-12 place-items-center rounded-xl border transition-all duration-300 shadow-xs ${
                          isSelected
                            ? "border-app-foreground bg-app-foreground text-white"
                            : "bg-brand-50 text-brand-700 border-brand-100 group-hover:bg-brand-100/70 group-hover:text-brand-850"
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-5.5" />
                      </span>

                      {/* Content details */}
                      <span className="mt-6 block text-[10px] font-extrabold tracking-wider text-brand-600 uppercase">
                        {option.eyebrow}
                      </span>
                      <span className="mt-2 block text-lg sm:text-xl font-extrabold tracking-tight text-app-foreground group-hover:text-brand-650 transition-colors">
                        {option.title}
                      </span>
                      <span className="mt-2.5 block text-xs sm:text-sm leading-relaxed text-app-muted font-medium break-keep">
                        {option.description}
                      </span>

                      {/* Action CTA */}
                      <span className={`mt-6 inline-flex items-center gap-1.5 text-xs font-black transition-all ${
                        isSelected 
                          ? "text-brand-600" 
                          : "text-brand-700 group-hover:text-brand-800"
                      }`}>
                        <span>{option.action}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-3.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>

                      {/* Custom Radio check dot */}
                      <span
                        aria-hidden="true"
                        className={`absolute right-6 top-6 grid size-6 place-items-center rounded-full border transition-all duration-300 ${
                          isSelected
                            ? "border-app-foreground bg-app-foreground text-white scale-100"
                            : "border-slate-200 bg-white text-transparent scale-95 group-hover:border-slate-350"
                        }`}
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <p className="flex items-start gap-2 text-xs leading-5 text-app-muted sm:max-w-md">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent-600"
                  />
                  선택 내용은 첫 화면을 구성하는 데만 사용됩니다. 이후 다른
                  역할로도 참여할 수 있습니다.
                </p>
                <button
                  type="button"
                  disabled={!intent}
                  onClick={continueToProfile}
                  className="primary-action inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-6 text-sm font-black disabled:bg-app-border-strong disabled:text-app-surface"
                >
                  계속하기
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </section>
          ) : (
            <section aria-labelledby="onboarding-profile-title">
              <button
                type="button"
                onClick={() => setStep("purpose")}
                className="mb-5 inline-flex items-center gap-2 rounded-control text-sm font-bold text-app-muted transition-colors hover:text-app-foreground"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {intent === "apply" ? "Back to role selection" : "이용 목적 다시 선택"}
              </button>

              <div className="grid overflow-hidden rounded-card border border-app-border bg-app-surface shadow-floating lg:grid-cols-[0.8fr_1.2fr]">
                <div className="bg-app-foreground p-7 text-white sm:p-9">
                  {selectedOption && SelectedIcon && (
                    <>
                      <span className="grid size-12 place-items-center rounded-xl bg-white/10 text-brand-300">
                        <SelectedIcon aria-hidden="true" className="size-6" />
                      </span>
                      <p className="mt-7 text-xs font-black tracking-[0.12em] text-brand-300 uppercase">
                        {selectedOption.eyebrow}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        {selectedOption.title}
                      </h2>
                      <p className="mt-4 text-sm leading-6 text-white/70">
                        {intent === "apply"
                          ? "We only need a few details to get you started. You can update your profile anytime as you work on projects."
                          : "지금은 시작에 필요한 정보만 받습니다. 세부 정보는 프로젝트를 진행하며 언제든 보완할 수 있어요."}
                      </p>
                    </>
                  )}
                </div>

                <form onSubmit={finishOnboarding} className="p-7 sm:p-9">
                  <div>
                    <p className="text-sm font-black text-brand-700">
                      {intent === "apply" ? "Basic information" : "기본 정보"}
                    </p>
                    <h1
                      id="onboarding-profile-title"
                      className="mt-2 text-2xl font-black tracking-tight text-app-foreground sm:text-3xl"
                    >
                      {intent === "recruit"
                        ? "프로젝트를 등록할 팀을 알려주세요"
                        : "Tell us what we need to know about you"}
                    </h1>
                  </div>

                  {intent === "recruit" ? (
                    <RecruiterFields />
                  ) : (
                    <ApplicantFields />
                  )}

                  <div className="mt-8 flex flex-col-reverse gap-3 border-t border-app-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-app-muted">
                      {intent === "apply"
                        ? "You can update this information in Settings."
                        : "입력한 정보는 설정에서 변경할 수 있습니다."}
                    </p>
                    <button
                      type="submit"
                      className="primary-action inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-6 text-sm font-black"
                    >
                      {intent === "recruit"
                        ? "프로젝트 등록하기"
                        : "Browse projects"}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function RecruiterFields() {
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-bold text-app-foreground sm:col-span-2">
        회사 또는 팀 이름
        <input
          required
          name="organizationName"
          autoComplete="organization"
          placeholder="예: 크로스랩"
          className={fieldClassName}
        />
      </label>
      <label className="text-sm font-bold text-app-foreground">
        담당자 이름
        <input
          required
          name="contactName"
          autoComplete="name"
          placeholder="이름을 입력해주세요"
          className={fieldClassName}
        />
      </label>
      <label className="text-sm font-bold text-app-foreground">
        담당자 역할
        <select required name="role" defaultValue="" className={fieldClassName}>
          <option value="" disabled>
            역할 선택
          </option>
          <option value="founder">대표 · 공동창업자</option>
          <option value="product-owner">Product Owner</option>
          <option value="operations">운영 담당자</option>
          <option value="other">기타</option>
        </select>
      </label>
      <label className="text-sm font-bold text-app-foreground">
        팀 규모
        <select required name="teamSize" defaultValue="" className={fieldClassName}>
          <option value="" disabled>
            팀 규모 선택
          </option>
          <option value="1-4">1–4명</option>
          <option value="5-10">5–10명</option>
          <option value="11-30">11–30명</option>
          <option value="31+">31명 이상</option>
        </select>
      </label>
      <label className="text-sm font-bold text-app-foreground">
        회사 웹사이트 <span className="font-medium text-app-muted">(선택)</span>
        <input
          name="website"
          type="url"
          autoComplete="url"
          placeholder="https://"
          className={fieldClassName}
        />
      </label>
    </div>
  );
}

function ApplicantFields() {
  const [portfolioLinkIds, setPortfolioLinkIds] = useState([0]);

  function addPortfolioLink() {
    setPortfolioLinkIds((currentIds) => [
      ...currentIds,
      Math.max(...currentIds, -1) + 1,
    ]);
  }

  function removePortfolioLink(linkId: number) {
    setPortfolioLinkIds((currentIds) => {
      if (currentIds.length === 1) {
        return currentIds;
      }

      return currentIds.filter((currentId) => currentId !== linkId);
    });
  }

  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-bold text-app-foreground">
        Display name
        <input
          required
          name="displayName"
          autoComplete="name"
          placeholder="Enter your name"
          className={fieldClassName}
        />
      </label>
      <label className="text-sm font-bold text-app-foreground">
        Time zone
        <select required name="timezone" defaultValue="Asia/Seoul" className={fieldClassName}>
          <option value="Asia/Seoul">Seoul (UTC+9)</option>
          <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
          <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
          <option value="Europe/London">London (UTC+0)</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="text-sm font-bold text-app-foreground sm:col-span-2">
        Professional headline
        <input
          required
          name="headline"
          placeholder="e.g. Full-stack developer building fast MVPs with Next.js"
          className={fieldClassName}
        />
      </label>
      <label className="text-sm font-bold text-app-foreground sm:col-span-2">
        Key skills or areas of expertise
        <input
          required
          name="skills"
          placeholder="e.g. Next.js, Node.js, PostgreSQL"
          className={fieldClassName}
        />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-bold text-app-foreground">
          GitHub or portfolio links{" "}
          <span className="font-medium text-app-muted">(optional)</span>
        </legend>

        <div className="space-y-2">
          {portfolioLinkIds.map((linkId, index) => (
            <div key={linkId} className="flex items-center gap-2">
              <input
                name="portfolioUrls"
                type="url"
                autoComplete="url"
                aria-label={`GitHub or portfolio link ${index + 1}`}
                placeholder="https://"
                className={`${fieldClassName} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => removePortfolioLink(linkId)}
                disabled={portfolioLinkIds.length === 1}
                aria-label={`Remove portfolio link ${index + 1}`}
                className="mt-2 grid size-12 shrink-0 place-items-center rounded-control border border-app-border-strong text-app-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:border-app-border disabled:bg-app-surface-subtle disabled:text-app-border-strong"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addPortfolioLink}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-control border border-app-border-strong px-3.5 text-sm font-bold text-app-foreground transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add link
        </button>
      </fieldset>
    </div>
  );
}
