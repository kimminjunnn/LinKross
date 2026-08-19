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
  Code,
  Check,
  Send
} from "lucide-react";

export default function DemoProjectPage() {
  const [activeTab, setActiveTab] = useState<"project" | "milestones" | "payments">("milestones");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  
  // Interactive States for Client PO Decisions
  const [m2Status, setM2Status] = useState<"pending" | "approved" | "rejected">("pending");
  const [m1InvoiceStatus, setM1InvoiceStatus] = useState<"pending" | "approved">("pending");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [savedRevisionReason, setSavedRevisionReason] = useState("");

  const handleApproveM2 = () => {
    setM2Status("approved");
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (revisionReason.trim()) {
      setSavedRevisionReason(revisionReason);
      setM2Status("rejected");
      setShowRevisionModal(false);
    }
  };

  const handleResetDemo = () => {
    setM2Status("pending");
    setM1InvoiceStatus("pending");
    setRevisionReason("");
    setSavedRevisionReason("");
  };

  // Mock SOW Sections (Korean original view for Korean Client PO)
  const sowSections = [
    {
      title: "업무 상세 내용 (Work Details)",
      body: "배경: 현재 웹페이지 내 사용자 로그인 분기 처리가 부자연스러워 사용자의 현재 진행 단계에 맞춰 올바르게 라우팅되도록 개선이 필요합니다.\n목표: 로그인 성공 시 Route 분기 로직을 수정하여 /dashboard로 안전하게 이동시키고 벨리데이션 오류 시 경고창을 표시합니다."
    },
    {
      title: "업무 범위 (Scope of Work)",
      body: "포함 사항:\n- 이메일 및 비밀번호 입력값 유효성 검사\n- 비밀번호 오류 및 이메일 미입력 시 오류 메시지 레이아웃 구현\n- 로그인 검증 성공 후 /dashboard 리다이렉트 흐름 제어\n\n제외 사항:\n- 소셜 로그인 연동 및 신규 회원가입 페이지 개발\n- 데이터베이스 스키마 수정 및 인프라 서버 배포"
    },
    {
      title: "완료 정의 (Definition of Done)",
      body: "개발자는 GitHub Pull Request를 제출해야 하며, LinKross 검수 에이전트(Playwright E2E)의 4개 테스트 케이스가 100% 통과하고, 발주사가 샌드박스에서 모바일 반응형 뷰를 검증해야 승인이 완료됩니다."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans selection:bg-slate-900 selection:text-white antialiased">
      {/* Header */}
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
          <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 uppercase tracking-wide">
            발주사 데모 모드 (Client PO View)
          </span>
        </div>

        <nav className="flex items-center gap-3">
          <button 
            onClick={handleResetDemo}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs hover:cursor-pointer"
          >
            <RotateCcw className="size-3.5" /> 데모 초기화
          </button>
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
        
        {/* Left Sidebar Mockup */}
        <aside className="w-64 border-r border-slate-200 bg-white p-5 space-y-6 hidden lg:block shrink-0 select-none">
          {/* Active Project Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">프로젝트 워크스페이스</p>
            <h3 className="font-semibold text-sm text-slate-900 truncate">로그인 분기 개선</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs text-slate-500">GitHub 레포 연동됨</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">접속 계정 정보</p>
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 bg-slate-50/30">
              <div className="size-8 rounded-full bg-slate-900 flex items-center justify-center font-semibold text-xs text-white">
                MJ
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-900 truncate">김민준 (CrossLab PO)</p>
                <p className="text-xs text-slate-400 truncate">ceo@crosslab.co</p>
              </div>
            </div>
          </div>

          {/* Navigation items in shadcn style */}
          <nav className="space-y-1.5 pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">메뉴</p>
            {[
              { id: "project", label: "프로젝트 SOW 계약서", icon: FileText },
              { id: "milestones", label: "마일스톤 검수 및 승인", icon: ShieldCheck },
              { id: "payments", label: "대금 청구 및 통합 증빙", icon: WalletCards }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as "project" | "milestones" | "payments")}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-all hover:cursor-pointer ${
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
          <div className="flex items-center gap-1.5 text-xs text-slate-400 select-none">
            <span>내 프로젝트</span>
            <ChevronRight className="size-3" />
            <span className="text-slate-900">로그인 분기 개선 MVP 프로젝트 (데모)</span>
          </div>

          {/* Project Banner Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-700 border-l border-b border-emerald-200/50 text-xs px-3 py-1 rounded-bl-lg tracking-wider">
              상호 서명 완료
            </div>
            
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">CrossLab · 발주사 전용 뷰</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">로그인 분기 개선 MVP 프로젝트</h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              제출된 결과물이 합의된 SOW 기준에 맞춰 올바르게 작동하는지 승인하거나 수정을 요구할 수 있습니다. (데모 페이지 인터랙션 가능)
            </p>

            {/* Mobile Tab Swapper */}
            <div className="mt-6 flex lg:hidden">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500">
                {[
                  { id: "project", label: "SOW", icon: FileText },
                  { id: "milestones", label: "검수/승인", icon: ShieldCheck },
                  { id: "payments", label: "증빙/청구", icon: WalletCards }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as "project" | "milestones" | "payments")}
                      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-all hover:cursor-pointer ${
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

          {/* Tab 1: Project Details View (Korean SOW) */}
          {activeTab === "project" && (
            <div className="space-y-6">
              {/* Overview Details Grid */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                  <Handshake className="size-4 text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-950">프로젝트 개요 및 마일스톤 예산</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "프로젝트 수행 기간", value: "2026-08-19 – 2026-08-31", icon: CalendarRange },
                    { label: "총 외주 계약금", value: "1,200 USD", icon: WalletCards },
                    { label: "현재 진행 상황", value: "개발 및 검수 단계", icon: Clock },
                    { label: "마일스톤 진행 현황", value: m2Status === "approved" ? "2/2 전체 승인 완료" : "1/2 검수 승인됨", icon: ShieldCheck }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                        <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Icon className="size-3.5" /> {item.label}
                        </dt>
                        <dd className="mt-2 text-sm text-slate-900">{item.value}</dd>
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
                    <h2 className="text-sm font-semibold text-slate-950">합의된 업무명세서 (SOW)</h2>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5">v1.0 SOW 승인 완료</span>
                    <span className="text-slate-400">해시 불변 잠금됨</span>
                  </div>

                  <div className="space-y-4">
                    {sowSections.map((section) => (
                      <article key={section.title} className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 space-y-2">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">{section.title}</h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{section.body}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {/* SOW Sign-off Details */}
                <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs h-fit space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserCheck className="size-4 text-slate-700" />
                    <h2 className="text-sm font-semibold text-slate-950">상호 서명 검증</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                      <div>
                        <p className="text-xs text-slate-800">김민준 대표 (PO)</p>
                        <p className="text-xs text-slate-400 mt-0.5">2026-08-19 서명됨</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="size-3.5" /> 승인완료
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                      <div>
                        <p className="text-xs text-slate-800">외국인 프리랜서</p>
                        <p className="text-xs text-slate-400 mt-0.5">2026-08-19 서명됨</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="size-3.5" /> 서명완료
                      </span>
                    </div>
                  </div>

                  <button disabled className="w-full h-10 rounded-lg bg-slate-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">
                    <UserCheck className="size-3.5" /> 상호 합의 서명 완료됨
                  </button>
                </aside>
              </div>
            </div>
          )}

          {/* Tab 2: Milestones & Verification (Client Review Actions) */}
          {activeTab === "milestones" && (
            <div className="space-y-6">
              {/* Connected repository banner */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <GitPullRequest className="size-5 text-slate-700 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-950">연동된 GitHub 코드 저장소</h2>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-2xl">
                      개발자가 코드를 작성하여 PR을 올릴 때, LinKross 검수 러너가 불변의 Commit SHA 단위로 안전하게 코드 설치, 빌드 및 자동 테스트를 처리합니다.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 self-start md:self-center">
                  github.com/crosslab/webpage-branch-fix <ExternalLink className="size-3.5 text-slate-400" />
                </div>
              </section>

              {/* Milestone 1 (Passed) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">마일스톤 1</span>
                      <h3 className="font-semibold text-sm text-slate-900">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                      <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-xs">
                        최종 승인 완료
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      기간: 2026-08-19 – 2026-08-25 · 배정 예산: 8,000 USD · 검수 대상: sha-a1b2c3d
                    </p>
                  </div>
                </div>

                {/* Submissions Details Grid */}
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  
                  {/* Left Column: Verification Results */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-800">에이전트 검수 내역</p>
                      <p className="text-xs text-slate-400">검수 스크립트: Playwright E2E</p>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        { desc: "이메일과 비밀번호를 입력할 수 있다.", id: "M1-C1" },
                        { desc: "정상 로그인 후 /dashboard로 이동한다.", id: "M1-C2" },
                        { desc: "잘못된 비밀번호 입력 시 오류가 표시된다.", id: "M1-C3" },
                        { desc: "이메일 미입력 시 로그인이 차단된다.", id: "M1-C4" }
                      ].map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-xs text-slate-400 block mb-0.5">{item.id}</span>
                            <p className="text-xs text-slate-800">{item.desc}</p>
                          </div>
                          <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                            통과 (Passed)
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Proof & Evidence triggers */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => setShowVideoModal(true)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer shadow-xs"
                      >
                        <Play className="size-3 text-slate-500 fill-slate-500" /> 검수 동영상 확인
                      </button>
                      <button 
                        onClick={() => setShowScreenshotModal(true)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="size-3 text-slate-500" /> 브라우저 화면 캡처본
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Code Commit Details & Sandbox Logs */}
                  <div className="space-y-4">
                    <p className="text-xs text-slate-800">에이전트 검수 빌드 로그</p>
                    <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto leading-relaxed shadow-md">
                      <p className="text-slate-500 select-none">[09:12:01] npm run build --silent</p>
                      <p className="text-slate-500 select-none">[09:12:02] npx playwright test</p>
                      <p className="text-white">Running 4 tests using 1 worker</p>
                      <p>✓ login.spec.ts:15:3 (Inputs interactable) (1.2s)</p>
                      <p>✓ login.spec.ts:25:3 (Redirect to dashboard) (850ms)</p>
                      <p>✓ login.spec.ts:32:3 (Credentials mismatch warning) (430ms)</p>
                      <p className="text-white font-semibold mt-1">✓ 4 passed (2.5s)</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Milestone 2 (Under Review - Interactive Client Decision Point) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">마일스톤 2</span>
                      <h3 className="font-semibold text-sm text-slate-900">M2 · QA 및 최종 검수 (Final QA & Inspection)</h3>
                      
                      {m2Status === "pending" && (
                        <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          승인 검토 대기
                        </span>
                      )}
                      {m2Status === "approved" && (
                        <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          최종 승인 완료
                        </span>
                      )}
                      {m2Status === "rejected" && (
                        <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          수정 요청됨
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      기간: 2026-08-25 – 2026-08-31 · 배정 예산: 4,000 USD · 검수 대상: sha-e5f6g7h
                    </p>
                  </div>
                </div>

                {/* Submissions Details Grid */}
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  
                  {/* Left Column: Verification Results */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-800">에이전트 검수 내역</p>
                      <p className="text-xs text-slate-400">검수 방법: 자동 스크립트 + 반응형 시각 검사</p>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        { desc: "Playwright 통합 시나리오 5개 전체 성공", method: "자동화 검증 스크립트 실행", status: "Passed", statusColor: "bg-green-50 text-green-700 border-green-100" },
                        { 
                          desc: "모바일 반응형 레이아웃 및 폰트 깨짐 없음", 
                          method: "시각적 요소 배치 비교", 
                          status: m2Status === "approved" ? "Passed" : "Review needed", 
                          statusColor: m2Status === "approved" ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100" 
                        }
                      ].map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start justify-between gap-3 shadow-xs">
                          <div>
                            <span className="text-xs text-slate-400 block mb-0.5">M2-C{idx + 1}</span>
                            <p className="text-xs text-slate-800">{item.desc}</p>
                            <p className="mt-1 text-xs text-slate-400">검수 방법: {item.method}</p>
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Interactive Decision Actions for Client PO */}
                    {m2Status === "pending" && (
                      <div className="rounded-lg border border-slate-200 p-5 bg-orange-50/20 space-y-4">
                        <div className="flex gap-2">
                          <Info className="size-4 shrink-0 mt-0.5 text-orange-600" />
                          <p className="text-xs text-slate-600 leading-relaxed">
                            <strong>발주사 의사결정 요청:</strong> Playwright 자동 테스트는 통과했지만 모바일 반응형 시각 검사에서 오차가 발견되었습니다. 프리뷰를 실행하여 모바일상에서 디자인이 무너지지 않는지 수동으로 확인한 후 승인 여부를 결정해주세요.
                          </p>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={handleApproveM2}
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs hover:cursor-pointer"
                          >
                            <Check className="size-3.5 mr-1" /> 최종 검수 승인
                          </button>
                          <button
                            onClick={() => setShowRevisionModal(true)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-xs hover:cursor-pointer"
                          >
                            <XCircle className="size-3.5 mr-1" /> 수정 요청 (반려)
                          </button>
                          <a href="#" className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs">
                            실행 프리뷰(Sandbox) 띄우기 <ExternalLink className="size-3.5 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}

                    {m2Status === "approved" && (
                      <div className="rounded-lg border border-green-200 p-4 bg-green-50/20 text-xs text-green-800 flex gap-2">
                        <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-green-600" />
                        <div>
                          <p>최종 검수를 승인하셨습니다.</p>
                          <p className="mt-1 text-slate-500">마일스톤 승인 서명이 블록체인에 영구 기록되었으며 프리랜서에게 대금 정산 요청이 전송되었습니다.</p>
                        </div>
                      </div>
                    )}

                    {m2Status === "rejected" && (
                      <div className="rounded-lg border border-red-200 p-4 bg-red-50/20 text-xs text-red-800 flex gap-2">
                        <XCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p>프리랜서에게 수정을 요구했습니다.</p>
                          <p className="mt-1 text-red-700"><strong>요청 사유:</strong> &quot;{savedRevisionReason}&quot;</p>
                          <p className="mt-2 text-slate-500">프리랜서가 이 요청 사유를 바탕으로 코드를 수정한 후 동일 조건으로 재검수를 신청하게 됩니다.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Code Commit Details & Sandbox Logs */}
                  <div className="space-y-4">
                    <p className="text-xs text-slate-800">에이전트 검수 빌드 로그</p>
                    <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto leading-relaxed shadow-md">
                      <p className="text-slate-500 select-none">[10:15:01] npm run build --silent</p>
                      <p className="text-slate-500 select-none">[10:15:02] npx playwright test e2e/visual.spec.ts</p>
                      <p className="text-white">Running visual regression checks...</p>
                      <p>✓ Desktop viewport matches baseline (100% match)</p>
                      
                      {m2Status === "approved" ? (
                        <p>✓ Mobile viewport manual visual inspection (100% matched by PO)</p>
                      ) : m2Status === "rejected" ? (
                        <p className="text-red-400">✗ Mobile viewport manual check rejected (Deviation: {savedRevisionReason})</p>
                      ) : (
                        <p className="text-amber-400">! Mobile viewport warning (95.8% match, deviation: 4.2%)</p>
                      )}
                      
                      <p className="text-white font-semibold mt-1">
                        {m2Status === "approved" && "✓ Verification approved by 김민준 PO"}
                        {m2Status === "rejected" && "✗ Verification rejected by 김민준 PO"}
                        {m2Status === "pending" && "! Verification pending client manual review"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: Payments & Evidence */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Invoice Panel */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="size-4 text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-950">마일스톤 정산 청구서 (Invoices)</h2>
                </div>
                <div className="space-y-3">
                  <article className="rounded-lg border border-slate-200 p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">마일스톤 1</span>
                      <h3 className="font-semibold text-sm text-slate-900 mt-2">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                      <p className="mt-1.5 text-xs text-slate-600">8,000 USD</p>
                      <p className="mt-1 text-xs text-slate-400">Invoice: INV-2026-001 · 외부 정산 참조 ID: TX-987654321</p>
                    </div>
                    
                    {m1InvoiceStatus === "pending" ? (
                      <div className="flex gap-2 shrink-0 self-start sm:self-center">
                        <button 
                          onClick={() => setM1InvoiceStatus("approved")}
                          className="inline-flex h-8 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 transition-colors hover:cursor-pointer shadow-xs"
                        >
                          대금 지급 승인
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 self-start sm:self-center shadow-xs">
                        대금 지급 승인 완료
                      </span>
                    )}
                  </article>
                </div>
              </section>

              {/* Evidence bundles */}
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileArchive className="size-4 text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-950">마일스톤 통합 증빙 (Evidence Bundles)</h2>
                </div>
                
                <div className="space-y-4">
                  <article className="rounded-lg border border-slate-200 p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">M1 통합 증빙 파일 v1.0</h3>
                        <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 text-xs">
                          증빙 생성 완료
                        </span>
                      </div>
                      <p className="break-all font-mono text-xs text-slate-400">
                        SHA-256: 7f83b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a29108374a5d6e7f8a9b0c1d
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        상호 승인 내역, 에이전트 빌드 로그, Playwright 테스트 검증 동영상 및 커밋 SHA 스냅샷이 압축 봉인된 증빙 파일입니다.
                      </p>
                    </div>
                    <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs shrink-0 self-start sm:self-center">
                      <Download className="size-3.5" /> 증빙 다운로드
                    </button>
                  </article>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Revision Request Modal (shadcn style) */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-sm text-slate-900">수정 요청 이유 작성</h3>
              <button 
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-1.5">반려 및 수정 요구 사항</label>
                <textarea
                  required
                  rows={4}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="예: 모바일 환경에서 로그인 버튼의 우측 패딩이 깨집니다. 폰트 크기를 줄이거나 마진을 조정해주세요."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center justify-center rounded-md bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Send className="size-3 mr-1" /> 수정 요청 전송
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal (shadcn/ui inspired Modal) */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
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
                <p className="mt-4 text-xs font-semibold text-white">Playwright verification recording simulation</p>
                <p className="text-xs text-slate-400 mt-1">Simulating execution: Page.goto(/login) ➡️ Fill email ➡️ Submit...</p>
              </div>
            </div>
            <div className="bg-slate-900 px-6 py-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
              <span>M1_Verification_Run_1_Record.mp4</span>
              <span>12.4 MB</span>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal (shadcn/ui inspired Modal) */}
      {showScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowScreenshotModal(false)}
              className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors hover:cursor-pointer"
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
                  <span className="text-xs text-slate-400">localhost:3000/login</span>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-slate-100 rounded-md" />
                  <div className="h-6 bg-slate-100 rounded-md" />
                  <div className="h-6 bg-slate-900 rounded-md" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
              <span>M1_Verification_Screenshot_Dashboard_Redirect.png</span>
              <span>850 KB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
