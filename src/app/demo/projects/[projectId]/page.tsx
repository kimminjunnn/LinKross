"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CalendarRange, 
  CheckCircle2, 
  CircleAlert, 
  Clock, 
  ExternalLink, 
  FileArchive, 
  FileText, 
  FolderKanban, 
  GitPullRequest, 
  Handshake, 
  HelpCircle, 
  Info, 
  Play, 
  RefreshCw, 
  RotateCcw, 
  ShieldCheck, 
  UserCheck, 
  WalletCards, 
  X, 
  XCircle 
} from "lucide-react";

export default function DemoProjectPage() {
  const [activeTab, setActiveTab] = useState<"project" | "milestones" | "payments">("milestones");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  // Mock SOW Sections
  const sowSections = [
    {
      title: "Korean Work Details (Translated)",
      body: "Background: The current webpage has issues with unnatural branching, which needs to be corrected. The branching should proceed according to the user's task status.\nObjective: To correct the unnatural branching on the webpage and ensure it proceeds correctly based on user task status."
    },
    {
      title: "Project Overview & Objectives",
      body: "Background: The application needs to dynamically route users after login depending on their current verification status.\nObjective: Complete the Next.js login screen routing, validate user inputs, and ensure correct redirection to /dashboard."
    },
    {
      title: "Scope of Work",
      body: "In-Scope:\n- Implementing validation for email and password inputs.\n- Setting up error message displays for wrong credentials.\n- Correcting the navigation logic for /dashboard route upon successful authentication.\n\nOut-of-Scope:\n- Designing a new theme/layout for the main application.\n- Setting up third-party OAuth providers."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 font-sans selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200/80 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 100" className="h-5 w-auto">
              <g transform="translate(10, 15)">
                <path d="M 35,60 L 58,20" fill="none" stroke="#0F172A" strokeWidth="13" strokeLinecap="round" />
                <path d="M 12,50 L 35,10 L 58,50" fill="none" stroke="#0F172A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 12,20 L 35,60" fill="none" stroke="#0F172A" strokeWidth="13" strokeLinecap="round" />
              </g>
              <text x="105" y="66" fontFamily="sans-serif" fontWeight="900" fontSize="52" letterSpacing="-1.5">
                <tspan fill="#0F172A">Lin </tspan><tspan fill="#0F172A">Kross</tspan>
              </text>
            </svg>
          </Link>
          <span className="h-4 w-px bg-slate-200"></span>
          <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200/60">
            Demo Sandbox
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-950 flex items-center gap-1 transition-colors">
            <ArrowLeft className="size-3.5" /> Exit Demo
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="size-3.5" /> Back to home
        </Link>

        {/* Page Header (shadcn/ui Card style) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">CrossLab · Client</p>
            <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
              Active Project
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Quarterly Improvement Project</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
            Review the project agreement, milestone verification, payments, and evidence in one continuous record.
          </p>

          {/* shadcn/ui Tab buttons style */}
          <nav className="mt-8">
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500">
              {[
                { id: "project", label: "Project Details", icon: FileText },
                { id: "milestones", label: "Milestones & Verification", icon: ShieldCheck },
                { id: "payments", label: "Payments & Evidence", icon: WalletCards }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs sm:text-sm font-semibold transition-all focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer ${
                      isActive 
                        ? "bg-white text-slate-950 shadow-xs" 
                        : "hover:text-slate-900"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Tab 1: Project details */}
        {activeTab === "project" && (
          <div className="space-y-6">
            {/* Overview Card */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <Handshake className="size-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-950">Project Overview</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Project period", value: "2026-08-19 – 2026-08-31", icon: CalendarRange },
                  { label: "Agreed budget", value: "1,200 USD", icon: WalletCards },
                  { label: "Current stage", value: "In progress", icon: Clock },
                  { label: "Milestones", value: "1/2 approved", icon: ShieldCheck }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                      <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Icon className="size-3.5 text-slate-400" /> {item.label}
                      </dt>
                      <dd className="mt-2.5 text-sm font-bold text-slate-900">{item.value}</dd>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SOW & Approval */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="size-4 text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-950">Statement of Work (SOW)</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-4">
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-600 font-bold">v1 Approved</span>
                    <span className="text-slate-400">Content hash verified</span>
                  </div>
                  {sowSections.map((section) => (
                    <article key={section.title} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{section.title}</h3>
                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-slate-650">{section.body}</p>
                    </article>
                  ))}
                </div>
              </section>

              {/* Dual Approval Panel in shadcn/ui style */}
              <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-fit space-y-6">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-950">Dual Approval</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200/80 p-4 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-600">Client (CrossLab)</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <CheckCircle2 className="size-3.5" /> Approved
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200/80 p-4 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-600">Freelancer (You)</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <CheckCircle2 className="size-3.5" /> Approved
                    </span>
                  </div>
                </div>
                
                {/* Primary Button style */}
                <button disabled className="w-full h-9 rounded-md bg-slate-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs opacity-50 cursor-not-allowed">
                  <UserCheck className="size-3.5" /> SOW Bilaterally Approved
                </button>

                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[11px] text-slate-500 leading-relaxed flex gap-2">
                  <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Bilateral approval locks SOW immutable content hash. Payment is still approved milestone by milestone.</span>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 2: Milestones & Verification */}
        {activeTab === "milestones" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header info card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-start gap-3">
                <GitPullRequest className="mt-0.5 size-4 shrink-0 text-slate-700" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Code submission and verification</h2>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Submit an open PR from the official project repository. LinKross locks the head Commit SHA and triggers the verification agent.
                  </p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                github.com/crosslab/webpage-branch-fix <ExternalLink className="size-3.5 text-slate-400" />
              </div>
            </div>

            {/* Milestone Card 1 (Passed) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                    <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                      Passed
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-400">
                    2026-08-19 – 2026-08-25 · 8,000 USD
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">1 submission</span>
              </div>

              {/* Latest Run Info (Clean nested card) */}
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">Latest submitted Commit</p>
                    <p className="mt-0.5 break-all font-mono text-xs font-bold text-slate-900">sha-a1b2c3d4e5f6g7h8</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                    Agent passed
                  </span>
                </div>

                {/* Criteria checklist */}
                <ul className="space-y-2.5">
                  {[
                    { desc: "이메일과 비밀번호를 입력할 수 있다. (Inputs are interactable)", method: "Playwright Automated Test" },
                    { desc: "정상 로그인 후 /dashboard로 이동한다. (Redirects to dashboard)", method: "Playwright Automated Test" },
                    { desc: "잘못된 비밀번호 입력 시 오류가 표시된다. (Handles invalid credentials)", method: "Playwright Automated Test" },
                    { desc: "이메일 미입력 시 로그인이 차단된다. (Validates empty fields)", method: "Playwright Automated Test" }
                  ].map((item, idx) => (
                    <li key={idx} className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start justify-between gap-3 shadow-xs">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.desc}</p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">Method: {item.method}</p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                        Passed
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Proof & Evidence triggers (Outline button style) */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button 
                    onClick={() => setShowVideoModal(true)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer shadow-xs"
                  >
                    <Play className="size-3 text-slate-500 fill-slate-500" /> Watch Video
                  </button>
                  <button 
                    onClick={() => setShowScreenshotModal(true)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="size-3 text-slate-500" /> View Screenshot
                  </button>
                  <a 
                    href="#" 
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    Open Sandbox <ExternalLink className="size-3 text-slate-500" />
                  </a>
                </div>
              </div>
            </div>

            {/* Milestone Card 2 (Under Review) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">M2 · QA 및 최종 검수 (Final QA & Inspection)</h3>
                    <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Under Review
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-400">
                    2026-08-25 – 2026-08-31 · 4,000 USD
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">1 submission</span>
              </div>

              {/* Latest Run Info */}
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">Latest submitted Commit</p>
                    <p className="mt-0.5 break-all font-mono text-xs font-bold text-slate-900">sha-e5f6g7h8i9j0k1l2</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                    Review required
                  </span>
                </div>

                {/* Criteria checklist */}
                <ul className="space-y-2.5">
                  {[
                    { desc: "Playwright 통합 시나리오 5개 전체 성공 (All 5 integration scenarios pass)", method: "Playwright Automated Test", status: "Passed", statusColor: "bg-green-50 text-green-700 border-green-100" },
                    { desc: "모바일 반응형 레이아웃 및 폰트 깨짐 없음 (Mobile responsive visual verification)", method: "Visual regression check", status: "Review needed", statusColor: "bg-amber-50 text-amber-700 border-amber-100" }
                  ].map((item, idx) => (
                    <li key={idx} className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start justify-between gap-3 shadow-xs">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.desc}</p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">Method: {item.method}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Warning message explaining why it needs review */}
                <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 text-[11px] text-amber-800 flex gap-2">
                  <Info className="size-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    <strong>Manual Review Required:</strong> Next.js code is successfully compiled and testing scripts passed. The client must manually check page responsiveness on the Vercel Sandbox.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payments & Evidence */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Invoice Panel */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-950">Milestone Invoices</h2>
              </div>
              <div className="space-y-4">
                <article className="rounded-lg border border-slate-200 p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                    <p className="mt-1.5 text-xs text-slate-500 font-bold">8,000 USD</p>
                    <p className="mt-1 text-[11px] text-slate-400">Invoice: INV-2026-001 · External ref: TX-987654321</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-center">
                    Submitted for review
                  </span>
                </article>
              </div>
            </section>

            {/* Evidence bundles */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <FileArchive className="size-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-950">Evidence Bundles</h2>
              </div>
              <div className="space-y-4">
                <article className="rounded-lg border border-slate-200 p-5 bg-slate-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evidence bundle v1</h3>
                    <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-0.5 text-[11px] font-bold">
                      Generated
                    </span>
                  </div>
                  <p className="mt-3 break-all font-mono text-[10px] text-slate-400">
                    SHA-256: 7f83b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a29108374a5d6e7f8a9b0c1d
                  </p>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Contains billing status, unilateral approvals, Playwright execution record, test specs, and code submissions.
                  </p>
                </article>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Video Modal (shadcn/ui inspired Modal) */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900/80 rounded-full p-2 transition-colors hover:cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div className="relative aspect-video flex items-center justify-center bg-slate-900">
              <div className="text-center p-6">
                <Play className="size-12 text-slate-400 mx-auto animate-pulse" />
                <p className="mt-4 text-xs font-bold text-white">Playwright verification recording simulation</p>
                <p className="text-[10px] text-slate-400 mt-1">Simulating execution: Page.goto(/login) ➡️ Fill email ➡️ Submit...</p>
              </div>
            </div>
            <div className="bg-slate-900 px-6 py-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
              <span>M1_Verification_Run_1_Record.mp4</span>
              <span>12.4 MB</span>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal (shadcn/ui inspired Modal) */}
      {showScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowScreenshotModal(false)}
              className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-950 bg-slate-100 hover:bg-slate-250 rounded-full p-2 transition-colors hover:cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              <div className="border border-slate-200 rounded-lg bg-white p-5 shadow-xs max-w-sm w-full">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">localhost:3000/login</span>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-slate-100 rounded-md" />
                  <div className="h-6 bg-slate-100 rounded-md" />
                  <div className="h-6 bg-slate-900 rounded-md" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
              <span>M1_Verification_Screenshot_Dashboard_Redirect.png</span>
              <span>850 KB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
