import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Search, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page/page-header";

export default function FreelancerHomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Freelancer workspace"
        title="Your next action, in one place."
        description="Review open work, manage your proposals, and keep every agreement, submission, and verification result connected."
      />

      <section className="mt-8 rounded-card border border-brand-200 bg-brand-50 p-6 shadow-card sm:p-7">
        <p className="text-xs font-black tracking-[0.12em] text-brand-700 uppercase">
          Next action
        </p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-app-foreground">
              Find a project that matches your delivery plan.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
              Open project details are available before sign-in. Submit a free-form
              proposal only when the scope, timeline, and acceptance criteria are clear.
            </p>
          </div>
          <Link
            href="/opportunities"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600"
          >
            Browse opportunities
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Search,
            title: "Find projects",
            description: "Compare the original scope, budget, timeline, and deadline.",
            href: "/opportunities",
          },
          {
            icon: BriefcaseBusiness,
            title: "My applications",
            description: "Return to drafts and review submitted proposal versions.",
            href: "/freelancer/applications",
          },
          {
            icon: ShieldCheck,
            title: "My projects",
            description: "Track SOW approval, commit submissions, verification, and payment.",
            href: "/freelancer/projects",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-card border border-app-border bg-app-surface p-5 shadow-card transition-colors hover:border-brand-300"
            >
              <Icon className="size-5 text-brand-600" />
              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-app-muted">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
