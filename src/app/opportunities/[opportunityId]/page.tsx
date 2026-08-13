"use client";

import Link from "next/link";
import { use } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Info,
  Calendar,
  Clock,
  DollarSign,
  Terminal,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { getOpportunity } from "@/data/opportunities";

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = use(params);
  const opportunity = getOpportunity(opportunityId);

  if (!opportunity) {
    notFound();
  }

  const applicationPath = `/freelancer/applications/${opportunity.id}`;
  const loginHref = `/login?role=freelancer&next=${encodeURIComponent(applicationPath)}`;

  // Mock Milestones for visual representation of SOW
  const mockMilestones = [
    {
      title: "Milestone 1: Repository setup & DB Schema",
      weight: "20%",
      criteria: [
        "PostgreSQL setup & multi-role table structures",
        "GitHub repository integration with initial commit SHA"
      ],
      verification: "Automatic setup script & DB connectivity check"
    },
    {
      title: "Milestone 2: Sign-in & Authentication flows",
      weight: "40%",
      criteria: [
        "Email & Password input validation",
        "Successful sign-in redirects to /dashboard",
        "Proper error messages for invalid credentials"
      ],
      verification: "Playwright E2E automation test script execution"
    },
    {
      title: "Milestone 3: Customer Portal MVP completion",
      weight: "40%",
      criteria: [
        "Security validation and data visualization layout",
        "All requirements resolved and code base sanitized"
      ],
      verification: "Full E2E suite validation & manual UI inspection"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] text-app-foreground pb-20">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <BrandLogo />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/opportunities" className="hover:text-brand-600 transition-colors">Find Projects</Link>
              <Link href="/freelancer/applications" className="hover:text-brand-600 transition-colors">My Applications</Link>
              <Link href="#" className="hover:text-brand-600 transition-colors">Messages</Link>
              <Link href="#" className="hover:text-brand-600 transition-colors">Payments</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login?role=freelancer&next=/freelancer"
              className="rounded-control border border-slate-300 hover:border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              Freelancer Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Back Link */}
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to all opportunities
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_21rem]">
          {/* Main Scope Info */}
          <div className="space-y-8">
            <article className="rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500" />
              
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-lg bg-orange-100 font-black text-xs text-brand-700 uppercase">
                  {opportunity.organization.charAt(0)}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {opportunity.organization}
                </span>
              </div>
              
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {opportunity.title}
              </h1>
              
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                {opportunity.summary}
              </p>

              {/* Requirement Section */}
              <section className="mt-9 border-t border-slate-100 pt-7">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-accent-600" />
                  Verified Requirements (Acceptance Criteria)
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  These requirements are automatically verified via LinKross E2E runner scripts upon PR submission.
                </p>
                <ul className="mt-5 space-y-3.5">
                  {opportunity.requirements.map((requirement, index) => (
                    <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-accent-500" />
                      <div>
                        <span className="font-semibold text-slate-800">Rule {index + 1}: </span>
                        {requirement}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Milestones & Timeline (Contra & Linear inspired) */}
              <section className="mt-9 border-t border-slate-100 pt-7">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Layers className="size-5 text-brand-600" />
                  Execution Milestones & SOW
                </h2>
                <div className="mt-6 space-y-6">
                  {mockMilestones.map((milestone, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-slate-200 last:border-0 pb-2">
                      {/* Timeline Node */}
                      <span className="absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white" />
                      
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{milestone.title}</h3>
                          <span className="inline-block text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-pill shrink-0 self-start sm:self-auto border border-brand-100">
                            Weight: {milestone.weight}
                          </span>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
                          {milestone.criteria.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-brand-500 mt-0.5 font-bold">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3.5 flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-accent-700 font-medium">
                          <Terminal className="size-4 shrink-0 text-accent-600" />
                          <span><strong className="font-bold">Verification: </strong> {milestone.verification}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Client Support */}
              <section className="mt-9 border-t border-slate-100 pt-7">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Activity className="size-5 text-slate-700" />
                  Provided from Client
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                  {opportunity.support.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      <span className="size-1.5 rounded-full bg-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Project Details Panel */}
            <aside className="rounded-card border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Specification</h3>
              
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <dt className="text-xs text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="size-4 text-slate-400" /> Budget
                  </dt>
                  <dd className="text-base font-black text-slate-900">{opportunity.budget}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <dt className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="size-4 text-slate-400" /> Expected Duration
                  </dt>
                  <dd className="text-sm font-bold text-slate-800">{opportunity.duration}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="size-4 text-slate-400" /> Apply Deadline
                  </dt>
                  <dd className="text-sm font-bold text-slate-800">{opportunity.deadline}</dd>
                </div>
              </dl>

              <Link
                href={loginHref}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg duration-200"
              >
                Apply for this project
                <ArrowRight className="size-4" />
              </Link>
              
              <p className="mt-4 text-center text-xs leading-relaxed text-slate-400 flex items-center justify-center gap-1">
                <Info className="size-3.5 text-slate-300" />
                Sign in is required to submit proposal.
              </p>

              {/* Progress Stepper Visual */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-brand-500" /> Work flow on LinKross
                </h4>
                <ol className="space-y-4 text-xs font-medium text-slate-500">
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-600">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Proposal Submission</p>
                      <p className="text-[10px] text-slate-400">Submit tech stack and implementation strategy.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-600">2</span>
                    <div>
                      <p className="font-bold text-slate-800">SOW Alignment & Signature</p>
                      <p className="text-[10px] text-slate-400">Lock the definition of done and milestones.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-600">3</span>
                    <div>
                      <p className="font-bold text-slate-800">Continuous Verification</p>
                      <p className="text-[10px] text-slate-400">Automated Playwright runner evaluates commits.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-600">4</span>
                    <div>
                      <p className="font-bold text-slate-800">Release & Invoice</p>
                      <p className="text-[10px] text-slate-400">Release payout after checklist approval.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
