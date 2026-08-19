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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 100" className="h-6 w-auto">
              <g transform="translate(10, 15)">
                <path d="M 35,60 L 58,20" fill="none" stroke="#F97316" strokeWidth="13" strokeLinecap="round" />
                <path d="M 12,50 L 35,10 L 58,50" fill="none" stroke="#0F172A" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 12,20 L 35,60" fill="none" stroke="#F97316" strokeWidth="13" strokeLinecap="round" />
              </g>
              <text x="105" y="66" fontFamily="sans-serif" fontWeight="900" fontSize="52" letterSpacing="-1.5">
                <tspan fill="#0F172A">Lin </tspan><tspan fill="#F97316">Kross</tspan>
              </text>
            </svg>
          </Link>
          <span className="h-5 w-px bg-slate-200"></span>
          <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md border border-orange-200">
            Demo Mode
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-950 flex items-center gap-1">
            <ArrowLeft className="size-4" /> Exit Demo
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 mb-6 transition-colors">
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        {/* Page Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <p className="text-xs font-black uppercase tracking-wider text-orange-600">CrossLab (Client)</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">Quarterly Improvement Project</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-3xl">
            Review the project agreement, milestone verification, payments, and evidence in one continuous record. (Interactive Simulation)
          </p>

          {/* Navigation Tabs */}
          <nav className="mt-8 border-b border-slate-200">
            <ul className="flex gap-1 sm:gap-4">
              {[
                { id: "project", label: "Project Details", icon: FileText },
                { id: "milestones", label: "Milestones & Verification", icon: ShieldCheck },
                { id: "payments", label: "Payments & Evidence", icon: WalletCards }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`relative flex min-h-12 items-center justify-center gap-2 px-4 text-center text-xs sm:text-sm font-black transition-colors ${
                        isActive ? "text-orange-600 border-b-2 border-orange-500" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="size-4" />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Tab 1: Project details */}
        {activeTab === "project" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Overview */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <Handshake className="size-5 text-orange-600" />
                <h2 className="text-lg font-black">Project Overview</h2>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <CalendarRange className="size-4 text-slate-450" /> Project period
                  </dt>
                  <dd className="mt-2 text-sm font-black">2026-08-19 – 2026-08-31</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <WalletCards className="size-4 text-slate-450" /> Agreed budget
                  </dt>
                  <dd className="mt-2 text-sm font-black">1,200 USD</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs font-bold text-slate-500">Current stage</dt>
                  <dd className="mt-2 text-sm font-black">In progress</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs font-bold text-slate-500">Milestones</dt>
                  <dd className="mt-2 text-sm font-black">1/2 approved</dd>
                </div>
              </dl>
            </section>

            {/* SOW & Approval */}
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="size-5 text-orange-600" />
                  <h2 className="text-lg font-black">Statement of Work (SOW)</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold mb-4">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-600">v1 Approved</span>
                    <span className="text-slate-450">Content hash verified</span>
                  </div>
                  {sowSections.map((section) => (
                    <article key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-sm font-black text-slate-900">{section.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{section.body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs h-fit space-y-6">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-5 text-orange-600" />
                  <h2 className="text-lg font-black">Dual Approval</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <span className="text-sm font-bold">Client (CrossLab)</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                      <CheckCircle2 className="size-4" /> Approved
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <span className="text-sm font-bold">Freelancer (You)</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                      <CheckCircle2 className="size-4" /> Approved
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-xs text-orange-700 leading-5">
                  Approval hash is locked in block. Changes require creating a new SOW version and bilateral approval.
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 2: Milestones & Verification */}
        {activeTab === "milestones" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Description */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-start gap-3">
                <GitPullRequest className="mt-0.5 size-5 shrink-0 text-orange-600" />
                <div>
                  <h2 className="text-lg font-black">Code submission and verification</h2>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Submit an open PR from the official project repository. LinKross locks the head Commit SHA and triggers the verification agent.
                  </p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                github.com/crosslab/webpage-branch-fix <ExternalLink className="size-4" />
              </div>
            </div>

            {/* Milestone Card 1: Passed */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                    <span className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black bg-green-100 text-green-700">
                      Passed
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    2026-08-19 – 2026-08-25 · 8,000 USD
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">1 submission</span>
              </div>

              {/* Latest Run Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Latest submitted Commit</p>
                    <p className="mt-1 break-all font-mono text-xs font-bold text-slate-900">sha-a1b2c3d4e5f6g7h8</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black bg-green-100 text-green-700">
                    Agent passed
                  </span>
                </div>

                {/* Criteria checklist */}
                <ul className="space-y-3">
                  {[
                    { desc: "이메일과 비밀번호를 입력할 수 있다. (Inputs are interactable)", method: "Playwright Automated Test" },
                    { desc: "정상 로그인 후 /dashboard로 이동한다. (Redirects to dashboard)", method: "Playwright Automated Test" },
                    { desc: "잘못된 비밀번호 입력 시 오류가 표시된다. (Handles invalid credentials)", method: "Playwright Automated Test" },
                    { desc: "이메일 미입력 시 로그인이 차단된다. (Validates empty fields)", method: "Playwright Automated Test" }
                  ].map((item, idx) => (
                    <li key={idx} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3 shadow-xs">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.desc}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">Method: {item.method}</p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black bg-green-100 text-green-700">
                        Passed
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Proof & Evidence triggers */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setShowVideoModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:underline hover:cursor-pointer"
                  >
                    <Play className="size-3.5 fill-orange-600" /> Watch verification video
                  </button>
                  <button 
                    onClick={() => setShowScreenshotModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:underline hover:cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" /> View test screenshot
                  </button>
                  <a href="#" className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:underline">
                    Open sandbox preview <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Milestone Card 2: Needs Review */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900">M2 · QA 및 최종 검수 (Final QA & Inspection)</h3>
                    <span className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-700">
                      Under Review
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    2026-08-25 – 2026-08-31 · 4,000 USD
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">1 submission</span>
              </div>

              {/* Latest Run Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Latest submitted Commit</p>
                    <p className="mt-1 break-all font-mono text-xs font-bold text-slate-900">sha-e5f6g7h8i9j0k1l2</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-700">
                    Review required
                  </span>
                </div>

                {/* Criteria checklist */}
                <ul className="space-y-3">
                  {[
                    { desc: "Playwright 통합 시나리오 5개 전체 성공 (All 5 integration scenarios pass)", method: "Playwright Automated Test", status: "Passed", statusColor: "bg-green-100 text-green-700" },
                    { desc: "모바일 반응형 레이아웃 및 폰트 깨짐 없음 (Mobile responsive visual verification)", method: "Visual regression check", status: "Review needed", statusColor: "bg-amber-100 text-amber-700" }
                  ].map((item, idx) => (
                    <li key={idx} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3 shadow-xs">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.desc}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">Method: {item.method}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Warning message explaining why it needs review */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex gap-2">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Why review is needed:</strong> Playwright automated script passed 100%, but visual checks require the client to manually review mobile responsiveness in the live sandbox.
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
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-orange-600" />
                <h2 className="text-lg font-black">Milestone Invoices</h2>
              </div>
              <div className="space-y-4">
                <article className="rounded-2xl border border-slate-200 p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-black text-slate-900">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                    <p className="mt-1 text-sm text-slate-500 font-bold">8,000 USD</p>
                    <p className="mt-1 text-xs text-slate-400">Invoice: INV-2026-001 · External ref: TX-987654321</p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-black bg-orange-100 text-orange-700 self-start sm:self-center">
                    Submitted for review
                  </span>
                </article>
              </div>
            </section>

            {/* Evidence bundles */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <FileArchive className="size-5 text-orange-600" />
                <h2 className="text-lg font-black">Evidence Bundles</h2>
              </div>
              <div className="space-y-4">
                <article className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <h3 className="text-sm font-black text-slate-900">Evidence bundle v1</h3>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Generated
                    </span>
                  </div>
                  <p className="mt-3 break-all font-mono text-xs text-slate-500">
                    SHA-256: 7f83b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a29108374a5d6e7f8a9b0c1d
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Contains billing status, unilateral approvals, Playwright execution record, test specs, and code submissions.
                  </p>
                </article>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Video Modal Simulation */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 text-white/75 hover:text-white bg-black/40 hover:bg-black/80 rounded-full p-2"
            >
              <X className="size-5" />
            </button>
            <div className="relative aspect-video flex items-center justify-center bg-slate-900">
              {/* Simulated Video Player */}
              <div className="text-center p-6">
                <Play className="size-16 text-orange-500 mx-auto animate-pulse" />
                <p className="mt-4 text-sm font-bold text-white">Playwright verification recording simulation</p>
                <p className="text-xs text-slate-400 mt-1">Simulating execution: Page.goto(/login) ➡️ Fill email ➡️ Submit...</p>
              </div>
            </div>
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
              <span>M1_Verification_Run_1_Record.mp4</span>
              <span>12.4 MB</span>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal Simulation */}
      {showScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowScreenshotModal(false)}
              className="absolute top-4 right-4 z-10 text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-full p-2"
            >
              <X className="size-5" />
            </button>
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              {/* Simulated Screenshot */}
              <div className="border border-slate-300 rounded-xl bg-white p-6 shadow-sm max-w-md w-full">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">localhost:3000/login</span>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-slate-100 rounded-md" />
                  <div className="h-8 bg-slate-100 rounded-md" />
                  <div className="h-8 bg-orange-500 rounded-md" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
              <span>M1_Verification_Screenshot_Dashboard_Redirect.png</span>
              <span>850 KB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
