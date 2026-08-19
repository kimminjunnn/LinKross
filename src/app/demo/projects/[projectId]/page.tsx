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
  XCircle,
  Download,
  AlertTriangle,
  ChevronRight,
  Code
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
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans selection:bg-slate-900 selection:text-white antialiased">
      {/* Header (Fully aligned with main layout) */}
      <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white px-6 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex shrink-0 items-center rounded-control">
            <img
              src="/brand/linkross-lockup-on-light.svg"
              alt="LinKross Logo"
              className="h-6 w-auto"
            />
          </Link>
          <span className="h-4 w-px bg-slate-200"></span>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 uppercase tracking-wide">
            Interactive Demo
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link 
            href="/" 
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="size-3.5" /> Exit Demo
          </Link>
        </nav>
      </header>

      {/* Main Workspace Dashboard Grid Layout */}
      <div className="mx-auto flex w-full max-w-7xl min-h-[calc(100vh-3.5rem)]">
        
        {/* Left Sidebar Mockup (Consistent with AppSidebar) */}
        <aside className="w-64 border-r border-slate-200 bg-white p-5 space-y-6 hidden lg:block shrink-0 select-none">
          {/* Active Project Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace</p>
            <h3 className="font-bold text-sm text-slate-900 truncate">Quarterly Improvement</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-medium text-slate-500">Connected to GitHub</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">User Profile</p>
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 bg-slate-50/30">
              <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-xs text-slate-700">
                FL
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 truncate">Foreign Freelancer</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">developer@linkross.com</p>
              </div>
            </div>
          </div>

          {/* Navigation items in shadcn style */}
          <nav className="space-y-1.5 pt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Navigation</p>
            {[
              { id: "project", label: "Project SOW details", icon: FileText },
              { id: "milestones", label: "Milestones & Verification", icon: ShieldCheck },
              { id: "payments", label: "Payments & Evidence", icon: WalletCards }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-bold transition-all hover:cursor-pointer ${
                    isActive 
                      ? "bg-slate-950 text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dashboard Content Container */}
        <main className="flex-1 min-w-0 bg-slate-50/50 p-6 lg:p-8 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 select-none">
            <span>My Projects</span>
            <ChevronRight className="size-3" />
            <span className="text-slate-900 font-semibold">Quarterly Improvement Project</span>
          </div>

          {/* Project Banner Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-700 border-l border-b border-emerald-200/50 text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase">
              Bilateral Approved
            </div>
            
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">CrossLab · B2B Client</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Quarterly Improvement Project</h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Verify the code deliverables automatically against the agreed Statement of Work (SOW). All runs are locked via SHA-256 evidence logs.
            </p>

            {/* Mobile Tab Swapper */}
            <div className="mt-6 flex lg:hidden">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500">
                {[
                  { id: "project", label: "SOW", icon: FileText },
                  { id: "milestones", label: "Verification", icon: ShieldCheck },
                  { id: "payments", label: "Evidence", icon: WalletCards }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-bold transition-all hover:cursor-pointer ${
                        isActive ? "bg-white text-slate-950 shadow-xs" : "hover:text-slate-900"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tab 1: Project Details View */}
          {activeTab === "project" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Overview Details Grid */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                  <Handshake className="size-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-950">Project Details</h2>
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
                          <Icon className="size-3.5" /> {item.label}
                        </dt>
                        <dd className="mt-2 text-sm font-bold text-slate-900">{item.value}</dd>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SOW and Dual Approval details */}
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileText className="size-4 text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-950">Statement of Work (SOW) Specifications</h2>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5">v1.0 SOW Active</span>
                    <span className="text-slate-400">Locked Hash: 9e102f...</span>
                  </div>

                  <div className="space-y-4">
                    {sowSections.map((section) => (
                      <article key={section.title} className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 space-y-2">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">{section.title}</h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{section.body}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {/* SOW Sign-off Details */}
                <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-fit space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserCheck className="size-4 text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-950">Dual Signature Status</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-150 p-4 bg-slate-50/50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Client (CrossLab)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Signed on 2026-08-19</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600">
                        <CheckCircle2 className="size-3.5" /> Signed
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-150 p-4 bg-slate-50/50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Freelancer (You)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Signed on 2026-08-19</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600">
                        <CheckCircle2 className="size-3.5" /> Signed
                      </span>
                    </div>
                  </div>

                  <button disabled className="w-full h-10 rounded-lg bg-slate-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">
                    <UserCheck className="size-3.5" /> SOW Bilaterally Signed
                  </button>

                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-[11px] text-slate-500 leading-relaxed flex gap-2">
                    <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>SOW content version cannot be modified after bilateral signature. New additions must be submitted as a v1.1 revision request.</span>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* Tab 2: Milestones & Verification (Redesigned to look extremely premium) */}
          {activeTab === "milestones" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Connected repository banner */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <GitPullRequest className="size-5 text-slate-700 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">Official project repository mapping</h2>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-2xl">
                      LinKross listens to code integrations from this repository. Submitting a pull request triggers isolated sandbox execution for verification.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 self-start md:self-center">
                  github.com/crosslab/webpage-branch-fix <ExternalLink className="size-3.5 text-slate-400" />
                </div>
              </section>

              {/* Milestone 1 (Passed) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">Milestone 1</span>
                      <h3 className="font-extrabold text-sm text-slate-900">웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                      <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 shadow-xs">
                        Passed
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      Period: 2026-08-19 – 2026-08-25 · Budget Allocation: 8,000 USD
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">1 submission run</span>
                </div>

                {/* Submissions Details Grid */}
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  
                  {/* Left Column: Verification Results */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-800">Verification checkmarks</p>
                      <p className="text-[11px] font-semibold text-slate-400">Method: Playwright Automated Suite</p>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        { desc: "이메일과 비밀번호를 입력할 수 있다. (Inputs are interactable)", id: "M1-C1" },
                        { desc: "정상 로그인 후 /dashboard로 이동한다. (Redirects to dashboard)", id: "M1-C2" },
                        { desc: "잘못된 비밀번호 입력 시 오류가 표시된다. (Handles invalid credentials)", id: "M1-C3" },
                        { desc: "이메일 미입력 시 로그인이 차단된다. (Validates empty fields)", id: "M1-C4" }
                      ].map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-slate-250 bg-white p-3.5 flex items-start justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{item.id}</span>
                            <p className="text-xs font-bold text-slate-800">{item.desc}</p>
                          </div>
                          <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black bg-green-50 text-green-700 border border-green-100">
                            Passed
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Proof & Evidence triggers */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => setShowVideoModal(true)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer shadow-xs"
                      >
                        <Play className="size-3 text-slate-500 fill-slate-500" /> Watch Verification Video
                      </button>
                      <button 
                        onClick={() => setShowScreenshotModal(true)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="size-3 text-slate-500" /> View Screenshot
                      </button>
                      <a 
                        href="#" 
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        Open Sandbox Preview <ExternalLink className="size-3 text-slate-500" />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Code Commit Details & Sandbox Logs */}
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-800">Runner Code Snapshots & Logs</p>
                    
                    <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4 space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Integration point</span>
                        <span className="font-mono text-xs font-bold text-slate-900 mt-1 break-all block">sha-a1b2c3d4e5f6g7h8</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Submitted by</span>
                        <span className="font-bold text-slate-800 mt-1 block">developer@linkross.com (PR #14)</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Verification status</span>
                        <span className="text-green-700 font-extrabold flex items-center gap-1.5 mt-1">
                          <CheckCircle2 className="size-3.5" /> Sandbox run successful
                        </span>
                      </div>
                    </div>

                    {/* Plausible Log Box */}
                    <div className="rounded-lg bg-slate-950 p-4 font-mono text-[10px] text-emerald-400 space-y-1 overflow-x-auto leading-relaxed shadow-md">
                      <p className="text-slate-500 select-none">[09:12:01] npm run build --silent</p>
                      <p className="text-slate-500 select-none">[09:12:02] npx playwright test</p>
                      <p className="text-white">Running 4 tests using 1 worker</p>
                      <p>✓ login.spec.ts:15:3 (Inputs interactable) (1.2s)</p>
                      <p>✓ login.spec.ts:25:3 (Redirect to dashboard) (850ms)</p>
                      <p>✓ login.spec.ts:32:3 (Credentials mismatch warning) (430ms)</p>
                      <p className="text-white font-bold mt-1">✓ 4 passed (2.5s)</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Milestone 2 (Under Review) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">Milestone 2</span>
                      <h3 className="font-extrabold text-sm text-slate-900">QA 및 최종 검수 (Final QA & Inspection)</h3>
                      <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        Under Review
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      Period: 2026-08-25 – 2026-08-31 · Budget Allocation: 4,000 USD
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">1 submission run</span>
                </div>

                {/* Submissions Details Grid */}
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  
                  {/* Left Column: Verification Results */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-800">Verification checkmarks</p>
                      <p className="text-[11px] font-semibold text-slate-400">Method: Visual Regression & Automation</p>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        { desc: "Playwright 통합 시나리오 5개 전체 성공 (All 5 integration scenarios pass)", method: "Playwright Automated Test", status: "Passed", statusColor: "bg-green-50 text-green-700 border-green-100" },
                        { desc: "모바일 반응형 레이아웃 및 폰트 깨짐 없음 (Mobile responsive visual verification)", method: "Visual regression check", status: "Review needed", statusColor: "bg-amber-50 text-amber-700 border-amber-100" }
                      ].map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-slate-250 bg-white p-3.5 flex items-start justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">M2-C{idx + 1}</span>
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
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-[11px] text-amber-800 flex gap-2.5">
                      <Info className="size-4 shrink-0 mt-0.5 text-amber-600" />
                      <p className="leading-relaxed">
                        <strong>Manual Client Action Required:</strong> While the automated Playwright scripts succeeded 100%, visual regression checks flagged a layout warning. Please click the <strong>Open Sandbox Preview</strong> link to manually confirm mobile responsive display.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Code Commit Details & Sandbox Logs */}
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-800">Runner Code Snapshots & Logs</p>
                    
                    <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-4 space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Integration point</span>
                        <span className="font-mono text-xs font-bold text-slate-900 mt-1 break-all block">sha-e5f6g7h8i9j0k1l2</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Submitted by</span>
                        <span className="font-bold text-slate-800 mt-1 block">developer@linkross.com (PR #15)</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Verification status</span>
                        <span className="text-amber-700 font-extrabold flex items-center gap-1.5 mt-1">
                          <AlertTriangle className="size-3.5 text-amber-600 animate-pulse" /> Pending visual sign-off
                        </span>
                      </div>
                    </div>

                    {/* Plausible Log Box */}
                    <div className="rounded-lg bg-slate-950 p-4 font-mono text-[10px] text-emerald-400 space-y-1 overflow-x-auto leading-relaxed shadow-md">
                      <p className="text-slate-500 select-none">[10:15:01] npm run build --silent</p>
                      <p className="text-slate-500 select-none">[10:15:02] npx playwright test e2e/visual.spec.ts</p>
                      <p className="text-white">Running visual regression checks...</p>
                      <p>✓ Desktop viewport matches baseline (100% match)</p>
                      <p className="text-amber-400">! Mobile viewport warning (95.8% match, deviation: 4.2%)</p>
                      <p className="text-white font-bold mt-1">! Verification pending client manual review</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: Payments & Evidence */}
          {activeTab === "payments" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Invoice Panel */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="size-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-950">Milestone Invoices</h2>
                </div>
                <div className="space-y-3">
                  <article className="rounded-lg border border-slate-200 p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Milestone 1</span>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-2">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                      <p className="mt-1.5 text-xs text-slate-500 font-bold">8,000 USD</p>
                      <p className="mt-1 text-[10px] text-slate-400">Invoice: INV-2026-001 · External ref: TX-987654321</p>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-center shadow-xs">
                      Submitted for review
                    </span>
                  </article>
                </div>
              </section>

              {/* Evidence bundles */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileArchive className="size-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-950">Evidence Bundles</h2>
                </div>
                
                <div className="space-y-4">
                  <article className="rounded-lg border border-slate-200 p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evidence bundle v1.0</h3>
                        <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 text-[10px] font-bold">
                          Generated
                        </span>
                      </div>
                      <p className="break-all font-mono text-[10px] text-slate-400">
                        SHA-256: 7f83b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a29108374a5d6e7f8a9b0c1d
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Contains locked billing status, bilateral approvals, Playwright execution records, test specification outputs, and code commit snapshots.
                      </p>
                    </div>
                    <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs shrink-0 self-start sm:self-center">
                      <Download className="size-3.5" /> Download Bundle
                    </button>
                  </article>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

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
