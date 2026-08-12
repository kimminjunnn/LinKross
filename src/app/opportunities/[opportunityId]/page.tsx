import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { getOpportunity } from "@/data/opportunities";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const opportunity = getOpportunity(opportunityId);

  if (!opportunity) {
    notFound();
  }

  const applicationPath = `/freelancer/applications/${opportunity.id}`;
  const loginHref = `/login?role=freelancer&next=${encodeURIComponent(applicationPath)}`;

  return (
    <div className="min-h-screen bg-app-canvas text-app-foreground">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-brand-700"
        >
          <ArrowLeft className="size-4" />
          All opportunities
        </Link>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_19rem]">
          <article className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8">
            <p className="text-xs font-black text-brand-700">{opportunity.organization}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {opportunity.title}
            </h1>
            <p className="mt-5 text-base leading-7 text-app-muted">
              {opportunity.summary}
            </p>

            <section className="mt-9 border-t border-app-border pt-7">
              <h2 className="text-xl font-black">Project requirements</h2>
              <ul className="mt-4 space-y-3">
                {opportunity.requirements.map((requirement) => (
                  <li key={requirement} className="flex gap-3 text-sm leading-6">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-accent-600" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-9 border-t border-app-border pt-7">
              <h2 className="text-xl font-black">Support from the client</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-app-muted">
                {opportunity.support.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="h-fit rounded-card border border-app-border bg-app-surface p-5 shadow-card lg:sticky lg:top-6">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-app-muted">Budget</dt>
                <dd className="mt-1 font-black">{opportunity.budget}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Expected duration</dt>
                <dd className="mt-1 font-black">{opportunity.duration}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Application deadline</dt>
                <dd className="mt-1 font-black">{opportunity.deadline}</dd>
              </div>
            </dl>
            <Link
              href={loginHref}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600"
            >
              Apply for this project
              <ArrowRight className="size-4" />
            </Link>
            <p className="mt-3 text-xs leading-5 text-app-muted">
              You will sign in before writing or submitting your proposal.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
