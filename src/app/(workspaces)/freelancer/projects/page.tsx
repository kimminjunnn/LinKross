"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  GitBranch, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  BadgeCheck,
  Send,
  Play,
  Terminal,
  FileCode2
} from "lucide-react";

import { PageHeader } from "@/components/page/page-header";

// Define TypeScript structures for high-fidelity project dashboard
type MilestoneStatus = "completed" | "in_progress" | "pending";

type MilestoneMock = {
  id: string;
  title: string;
  budget: string;
  status: MilestoneStatus;
  criteria: string[];
  verificationResult?: {
    passed: number;
    total: number;
    commitSha: string;
  };
};

type ActiveProjectMock = {
  id: string;
  title: string;
  client: string;
  totalBudget: string;
  githubRepo: string;
  branch: string;
  lastCommitSha: string;
  milestones: MilestoneMock[];
};

export default function FreelancerProjectsPage() {
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>("m2");

  // Sample data: active developer workspace representing the LinKross flow
  const activeProject: ActiveProjectMock = {
    id: "customer-portal-mvp",
    title: "Customer portal MVP",
    client: "Crosslab",
    totalBudget: "$12,000",
    githubRepo: "github.com/crosslab/customer-portal",
    branch: "main",
    lastCommitSha: "a8f3b2c",
    milestones: [
      {
        id: "m1",
        title: "Milestone 1: Project Setup & DB Schema",
        budget: "$2,400",
        status: "completed",
        criteria: [
          "PostgreSQL multi-role schema definitions initialized.",
          "GitHub actions pipeline successfully configured."
        ],
        verificationResult: {
          passed: 2,
          total: 2,
          commitSha: "da155eb"
        }
      },
      {
        id: "m2",
        title: "Milestone 2: Sign-in & Authentication E2E Flow",
        budget: "$4,800",
        status: "in_progress",
        criteria: [
          "Email and password forms accept interactive inputs.",
          "Redirect logic routes users to /dashboard on authentication success.",
          "Valid error notifications are displayed for missing/incorrect inputs."
        ],
        verificationResult: {
          passed: 1,
          total: 3,
          commitSha: "a8f3b2c"
        }
      },
      {
        id: "m3",
        title: "Milestone 3: Customer Portal Final UI & Security",
        budget: "$4,800",
        status: "pending",
        criteria: [
          "Full UI integration of dashboards according to mockup layout specs.",
          "Stripe webhook events test pass on test suites."
        ]
      }
    ]
  };

  // Past Contracts (Completed projects history)
  const pastProjects = [
    {
      title: "API Gateway Integration Suite",
      client: "ShopVibe",
      budget: "$8,500",
      completedAt: "July 24, 2026",
      evidenceHash: "0x8fa...4c2a"
    }
  ];

  const getMilestoneStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="size-3" /> Released & Paid
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-750 border border-brand-100">
            <Clock className="size-3" /> In Verification
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
            Pending Start
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMilestoneId(expandedMilestoneId === id ? null : id);
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        eyebrow="Deliveries & QA Workspace"
        title="Deliveries & QA"
        description="Verify your code deliverables in isolated sandbox test runners and track milestones approvals."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Active Project Dashboard Workspace */}
        <div className="space-y-6">
          <div className="rounded-card border border-slate-200 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Header indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500" />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Active Contract</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{activeProject.title}</h2>
                <p className="text-sm text-slate-500 mt-1">Client: <strong className="font-semibold">{activeProject.client}</strong></p>
              </div>
              <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-left sm:text-right shrink-0">
                <span className="text-xs text-slate-400 block font-medium">Contract Value</span>
                <span className="text-lg font-black text-slate-900">{activeProject.totalBudget}</span>
              </div>
            </div>

            {/* GitHub integration box (Vercel inspired) */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-slate-900 grid place-items-center text-white shrink-0">
                  <FileCode2 className="size-5 text-brand-500" />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block font-medium">CONNECTED REPOSITORY</span>
                  <a href={`https://${activeProject.githubRepo}`} target="_blank" rel="noreferrer" className="font-bold text-slate-800 flex items-center gap-1 hover:underline">
                    {activeProject.githubRepo} <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="size-4 text-slate-400" />
                  <span>Branch: <strong className="font-bold text-slate-800">{activeProject.branch}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent-500 animate-ping" />
                  <span>Last Commit SHA: <strong className="font-bold text-slate-850 bg-slate-200/80 px-1.5 py-0.5 rounded font-mono">{activeProject.lastCommitSha}</strong></span>
                </div>
              </div>
            </div>

            {/* SOW Milestones Tracker */}
            <div className="mt-8 border-t border-slate-100 pt-7">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-6">
                <ShieldCheck className="size-5 text-accent-600" />
                SOW Milestone Verification
              </h3>
              
              <div className="space-y-4">
                {activeProject.milestones.map((milestone) => {
                  const isExpanded = expandedMilestoneId === milestone.id;
                  const hasVerif = !!milestone.verificationResult;
                  return (
                    <div 
                      key={milestone.id}
                      className={`rounded-xl border transition-all ${
                        milestone.status === "in_progress" 
                          ? "border-brand-200/70 bg-gradient-to-br from-white to-brand-50/10" 
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        onClick={() => toggleExpand(milestone.id)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <h4 className="text-sm font-bold text-slate-900">{milestone.title}</h4>
                          <div className="flex items-center gap-2 mt-1 sm:mt-0">
                            {getMilestoneStatusBadge(milestone.status)}
                            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-150">{milestone.budget}</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-slate-100/80 pt-4 space-y-4 animate-fadeIn">
                          <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scope Acceptance Criteria (DoD)</h5>
                            <ul className="space-y-2">
                              {milestone.criteria.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                                  <CheckCircle2 className="size-4 shrink-0 text-accent-500 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Verification Runner Logs Panel (Vercel Style) */}
                          {hasVerif && (
                            <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-xs border border-slate-800">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <span className="size-2 rounded-full bg-emerald-500" /> PLAYWRIGHT RUNNER RESULT
                                </span>
                                <span>Commit: {milestone.verificationResult?.commitSha}</span>
                              </div>
                              <p className="text-emerald-400">✓ Running tests on isolated VM container...</p>
                              <p className="mt-1">✓ Setup environment with PostgreSQL schema migration.</p>
                              <p className="mt-1 text-slate-400">
                                [Test Output] {milestone.verificationResult?.passed}/{milestone.verificationResult?.total} tests passed.
                              </p>
                              {milestone.status === "in_progress" && (
                                <div className="mt-3 bg-slate-800 p-2.5 rounded-lg text-[10px] text-amber-300 flex items-start gap-2">
                                  <AlertCircle className="size-4 shrink-0 text-amber-400 mt-0.5" />
                                  <div>
                                    <p className="font-bold">Pending 1 requirement validation</p>
                                    <p className="mt-0.5 text-slate-450 leading-relaxed">
                                      "Redirect logic routes users to /dashboard" is failing (assertion timeout 5000ms). Please submit a fix commit or request manual evaluation.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions Inside Card */}
                          {milestone.status === "in_progress" && (
                            <div className="flex flex-wrap gap-2.5 justify-end pt-2">
                              <button className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-slate-300 px-4 text-xs font-bold hover:bg-slate-50 text-slate-700 bg-white transition-all shadow-sm">
                                View Verification Reports
                              </button>
                              <button className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control bg-brand-500 px-4 text-xs font-bold text-white hover:bg-brand-600 transition-all shadow-sm">
                                <Play className="size-3.5 fill-white" /> Trigger Re-run
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Panels (Contra / Upwork style) */}
        <div className="space-y-6">
          {/* SOW quick sheet */}
          <aside className="rounded-card border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-4" /> Signed SOW Summary
            </h3>
            
            <div className="mt-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">CONTRACT DATE</span>
                <span className="font-bold text-slate-800">August 13, 2026</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">TOTAL EARNED</span>
                <span className="font-black text-slate-900">$2,400 <span className="text-[10px] text-slate-400 font-normal">out of $12,000</span></span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">TEST DATABASE</span>
                <span className="font-bold text-slate-800">PostgreSQL (Synthetic Data)</span>
              </div>
            </div>

            <button className="w-full mt-6 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-slate-300 px-4 text-xs font-bold hover:bg-slate-50 text-slate-700 bg-white transition-all">
              View Signed PDF
            </button>
          </aside>

          {/* Past Contracts history */}
          <aside className="rounded-card border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-emerald-600" /> Completed Projects ({pastProjects.length})
            </h3>
            
            <div className="mt-5 space-y-4">
              {pastProjects.map((proj, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <h4 className="font-bold text-slate-800">{proj.title}</h4>
                  <p className="text-slate-500 mt-1">Client: {proj.client}</p>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/60">
                    <span className="font-black text-slate-900">{proj.budget}</span>
                    <span className="text-slate-400">{proj.completedAt}</span>
                  </div>
                  
                  <button className="w-full mt-3 inline-flex min-h-8 items-center justify-center gap-1 rounded-control bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-[11px]">
                    View Evidence Pack
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
