import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, WalletCards } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { OPPORTUNITIES } from "@/data/opportunities";

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-app-canvas text-app-foreground">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Link
            href="/login?role=freelancer&next=/freelancer"
            className="rounded-control border border-app-border-strong px-4 py-2 text-sm font-bold hover:bg-app-surface-subtle"
          >
            Freelancer sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-black tracking-[0.14em] text-brand-700 uppercase">
          Open opportunities
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
          Find a project with a clear scope and acceptance criteria.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-app-muted">
          Review the original project details before you sign in. You only need an
          account when you are ready to submit your proposal.
        </p>

        <div className="mt-10 grid gap-5">
          {OPPORTUNITIES.map((opportunity) => (
            <article
              key={opportunity.id}
              className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-7"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-700">
                    {opportunity.organization}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{opportunity.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
                    {opportunity.summary}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {opportunity.skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-pill bg-app-surface-subtle px-3 py-1 text-xs font-bold"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600"
                >
                  View project
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <dl className="mt-6 grid gap-3 border-t border-app-border pt-5 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <WalletCards className="size-4 text-app-muted" />
                  <span className="font-bold">{opportunity.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-app-muted" />
                  <span>{opportunity.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-app-muted" />
                  <span>Apply by {opportunity.deadline}</span>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
