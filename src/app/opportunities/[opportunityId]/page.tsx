import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  FileCheck2,
  Info,
  Layers3,
} from "lucide-react";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { getPublicOpportunity } from "@/lib/backend/projects";
import {
  formatBudget,
  formatProjectDate,
  formatProjectPeriod,
  technologyTags,
} from "@/lib/opportunities/presentation";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const result = await getPublicOpportunity(opportunityId);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND" || result.error.code === "INVALID_INPUT") {
      notFound();
    }

    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-card border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <h1 className="text-lg font-black">프로젝트를 불러오지 못했습니다.</h1>
          <p className="mt-2">{result.error.message}</p>
          <Link href="/opportunities" className="mt-5 inline-flex font-bold text-brand-700">
            프로젝트 목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const opportunity = result.data;
  const technologies = technologyTags(opportunity.technology);
  const applicationPath = `/freelancer/applications/${opportunity.id}`;
  const loginHref = `/login?role=freelancer&next=${encodeURIComponent(applicationPath)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] pb-20 text-app-foreground">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Link
            href="/login?role=freelancer&next=/freelancer"
            className="rounded-control border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            프리랜서 로그인
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/opportunities"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="size-4" />
          프로젝트 목록
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_21rem]">
          <article className="relative overflow-hidden rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500" />

            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-black text-brand-700 uppercase">
                {opportunity.organizationName.charAt(0)}
              </span>
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                {opportunity.organizationName}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {opportunity.title}
            </h1>
            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-slate-600">
              {opportunity.goal}
            </p>

            {technologies.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {technologies.map((technology) => (
                  <li
                    key={technology}
                    className="rounded-pill border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-650"
                  >
                    {technology}
                  </li>
                ))}
              </ul>
            )}

            <DetailSection title="핵심 요구사항" icon={<FileCheck2 className="size-5 text-accent-600" />}>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {opportunity.requirements}
              </p>
            </DetailSection>

            {opportunity.deliverables && (
              <DetailSection title="기대 결과물" icon={<Layers3 className="size-5 text-brand-600" />}>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {opportunity.deliverables}
                </p>
              </DetailSection>
            )}

            {opportunity.outOfScope && (
              <DetailSection title="제외 범위">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {opportunity.outOfScope}
                </p>
              </DetailSection>
            )}

            {opportunity.applicantGuidance && (
              <DetailSection title="지원자 안내">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {opportunity.applicantGuidance}
                </p>
              </DetailSection>
            )}
          </article>

          <aside className="h-fit rounded-card border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">프로젝트 조건</h2>

            <dl className="mt-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <DollarSign className="size-4 text-slate-400" /> 예산
                </dt>
                <dd className="mt-1 text-base font-black text-slate-900">
                  {formatBudget(
                    opportunity.budgetAmount,
                    opportunity.budgetMaxAmount,
                    opportunity.budgetType,
                    opportunity.currency,
                  )}
                </dd>
              </div>
              <div className="border-b border-slate-100 pb-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="size-4 text-slate-400" /> 프로젝트 기간
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatProjectPeriod(opportunity.startDate, opportunity.endDate)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="size-4 text-slate-400" /> 지원 마감
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatProjectDate(opportunity.recruitmentEndAt)}
                </dd>
              </div>
            </dl>

            <Link
              href={loginHref}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
            >
              이 프로젝트에 지원하기
              <ArrowRight className="size-4" />
            </Link>
            <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs leading-relaxed text-slate-400">
              <Info className="size-3.5 text-slate-300" />
              수행 제안서 제출에는 로그인이 필요합니다.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 border-t border-slate-100 pt-7">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
        {icon}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
