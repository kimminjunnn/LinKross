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

import { switchWorkspace } from "@/app/actions/workspace";
import { BrandLogo } from "@/components/layout/brand-logo";
import { getPublicOpportunity } from "@/lib/backend/projects";
import { getAuthContext, getWorkspaceHome } from "@/lib/auth/workspace-access";
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
  const [result, authContext] = await Promise.all([
    getPublicOpportunity(opportunityId),
    getAuthContext(),
  ]);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND" || result.error.code === "INVALID_INPUT") {
      notFound();
    }

    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-card border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <h1 className="text-lg font-black">Failed to load project.</h1>
          <p className="mt-2">{result.error.message}</p>
          <Link href="/opportunities" className="mt-5 inline-flex font-bold text-brand-700">
            Back to Project List
          </Link>
        </div>
      </main>
    );
  }

  const opportunity = result.data;
  const technologies = technologyTags(opportunity.technology);
  const applicationPath = `/freelancer/applications/${opportunity.id}`;
  const loginHref = `/login?role=freelancer&next=${encodeURIComponent(applicationPath)}`;
  const isAuthenticated = authContext.userId !== null;
  const isFreelancerWorkspaceActive = authContext.activeRole === "freelancer";
  const workspaceHref =
    isAuthenticated && authContext.activeRole
      ? getWorkspaceHome(authContext.activeRole)
      : "/login?role=freelancer&next=/freelancer";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] pb-20 text-app-foreground">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Link
            href={workspaceHref}
            className="rounded-control border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            {isAuthenticated ? "My Workspace" : "Freelancer Login"}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/opportunities"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="size-4" />
          Project List
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

            <DetailSection title="Key Requirements" icon={<FileCheck2 className="size-5 text-accent-600" />}>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {opportunity.requirements}
              </p>
            </DetailSection>

            {opportunity.deliverables && (
              <DetailSection title="Expected Deliverables" icon={<Layers3 className="size-5 text-brand-600" />}>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {opportunity.deliverables}
                </p>
              </DetailSection>
            )}

            {opportunity.outOfScope && (
              <DetailSection title="Out of Scope">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {opportunity.outOfScope}
                </p>
              </DetailSection>
            )}

            {opportunity.applicantGuidance && (
              <DetailSection title="Applicant Guidance">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {opportunity.applicantGuidance}
                </p>
              </DetailSection>
            )}
          </article>

          <aside className="h-fit rounded-card border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Project Terms</h2>

            <dl className="mt-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <DollarSign className="size-4 text-slate-400" /> Budget
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
                  <Clock className="size-4 text-slate-400" /> Project Period
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatProjectPeriod(opportunity.startDate, opportunity.endDate, "en-US")}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="size-4 text-slate-400" /> Deadline
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  {formatProjectDate(opportunity.recruitmentEndAt, "en-US")}
                </dd>
              </div>
            </dl>

            {isFreelancerWorkspaceActive ? (
              <Link
                href={applicationPath}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
              >
                Write SOW Proposal
                <ArrowRight className="size-4" />
              </Link>
            ) : isAuthenticated ? (
              <form action={switchWorkspace} className="mt-8">
                <input type="hidden" name="role" value="freelancer" />
                <input type="hidden" name="next" value={applicationPath} />
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
                >
                  Switch to Freelancer and Apply
                  <ArrowRight className="size-4" />
                </button>
              </form>
            ) : (
              <Link
                href={loginHref}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
              >
                Login and Apply
                <ArrowRight className="size-4" />
              </Link>
            )}
            <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs leading-relaxed text-slate-400">
              <Info className="size-3.5 text-slate-300" />
              {isFreelancerWorkspaceActive
                ? "Draft a SOW proposal based on the project requirements."
                : isAuthenticated
                  ? "Switch to the freelancer role to write a SOW proposal."
                  : "Login is required to submit a SOW proposal."}
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
