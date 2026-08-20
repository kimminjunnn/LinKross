import Link from 'next/link';
import { redirect } from "next/navigation";

import { getAuthContext, getWorkspaceHome } from "@/lib/auth/workspace-access";

export default async function HomePage() {
  const isAuthConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (isAuthConfigured) {
    const context = await getAuthContext();

    if (context.userId && context.activeRole) {
      redirect(getWorkspaceHome(context.activeRole));
    }

    if (context.userId) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. Header (Clean White Header with Transparent Orange/Navy Logo) */}
      <header className="w-full bg-white border-b border-slate-200 px-6 sm:px-10 py-4 flex justify-between items-center shadow-xs sticky top-0 z-50 backdrop-blur-md">
        {/* Logo Section - Transparent Background Logo */}
        <div className="flex items-center">
          <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 440 100"
              className="h-9 w-auto cursor-pointer"
            >
              {/* Interlocking Symbol (Orange & Dark Navy) */}
              <g transform="translate(10, 15)">
                <path
                  d="M 35,60 L 58,20"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
                <path
                  d="M 12,50 L 35,10 L 58,50"
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 12,20 L 35,60"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
              </g>
              {/* Text: Lin (Dark Navy) Kross (Orange) */}
              <text
                x="105"
                y="66"
                fontFamily="'Inter', 'Pretendard', system-ui, sans-serif"
                fontWeight="900"
                fontSize="52"
                letterSpacing="-1.5"
              >
                <tspan fill="#0F172A">Lin </tspan>
                <tspan fill="#F97316">Kross</tspan>
              </text>
            </svg>
          </Link>
        </div>

        {/* Header Right Badge */}
        <div className="flex items-center">
          <span className="text-xs px-3.5 py-1.5 bg-orange-100 text-orange-600 rounded-full border border-orange-200 shadow-xs">
            B2B 프로젝트 검증 워크스페이스
          </span>
        </div>
      </header>

      {/* 2. Hero Body Section (Light Background) */}
      <main className="flex-1 relative overflow-hidden bg-white">
        {/* Subtle Background Accent Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-orange-500/8 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl w-full mx-auto px-6 py-16 sm:py-20 flex flex-col items-center justify-center text-center relative z-10">
          {/* Main Badge */}
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-600 border border-orange-500/20 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-8 shadow-xs backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            <span>초기 스타트업 및 대표님을 위한 외주 개발 통합 가이드</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 leading-[1.35] sm:leading-[1.35] tracking-tight mb-8 break-keep">
            사내 CTO가 없어도 <br />
            <span className="text-orange-500">해외 외주 개발자와 완벽하게 협업</span>하세요
          </h1>

          {/* Sub description */}
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mb-14 leading-relaxed break-keep">
            <span className="text-slate-900">개발 지식 없어도 괜찮습니다.</span>
            <br />
            <span className="text-orange-600">개발자 선정부터 요구사항 정리, 작동하는 MVP 검수까지 한 곳에서.</span>
          </p>

          {/* 3 Value Proposition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-16">
            {/* Value 1: Domestic vs Offshore Freelancer Cost Reduction */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-orange-500/80 transition-all shadow-sm hover:shadow-md space-y-3.5">
              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-semibold text-xs">
                01. 비용 절감 & 외주 리스크 차단
              </div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight break-keep">CTO 채용 없이 외주비 낭비 방지</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-keep">
                국내 프리랜서 대비 <strong className="text-orange-600">해외 개발자 매칭으로 개발비 60% 절감</strong>, 사내 CTO/QA 채용 대비 <strong className="text-orange-600">인건비를 70% 이상 절감</strong>하여 외주 리스크를 차단합니다.
              </p>
            </div>

            {/* Value 2: AI SOW Headline & Highlight Metric */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-orange-500/80 transition-all shadow-sm hover:shadow-md space-y-3.5">
              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-semibold text-xs">
                02. 비개발자 맞춤 소통 편의성
              </div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight break-keep">어려운 업무명세서 작업, AI로 한 번에 해결하세요</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-keep">
                작성에 며칠씩 걸리던 SOW(업무명세서)를 <strong className="text-orange-600">AI 자동 생성으로 작성 시간 90% 단축</strong>하고, 비개발자도 직관 확인 가능한 조건으로 합의합니다.
              </p>
            </div>

            {/* Value 3: Automated Verification Highlight Metric */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-orange-500/80 transition-all shadow-sm hover:shadow-md space-y-3.5">
              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-semibold text-xs">
                03. 확실한 결과물 검수 & 승인
              </div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight break-keep">작동 화면과 증거로 직접 승인</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-keep">
                코드를 읽지 못해도 괜찮습니다. <strong className="text-orange-600">자동 판정 정확도 90%</strong>와 시연 영상 증거로 <strong className="text-orange-600">검수 확인 시간을 30% 단축</strong>하여 안심 승인하세요.
              </p>
            </div>
          </div>

          {/* Member Selection CTA Cards (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-8">
            {/* 기존 회원 (로그인 화면 /login 으로 이동) */}
            <Link
              href="/login"
              className="group relative p-8 bg-white border-2 border-slate-200 hover:border-orange-500 rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-orange-100 text-slate-700 group-hover:text-orange-600 flex items-center justify-center mb-6 transition-colors duration-300 shadow-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-slate-900 mb-2">기존 회원이신가요?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed break-keep">
                로그인 화면으로 이동하여 내 프로젝트 진행 상황과 검수 내역을 확인하세요.
              </p>
              
              <div className="mt-auto w-full py-3 px-4 rounded-xl bg-slate-100 group-hover:bg-orange-500 text-slate-700 group-hover:text-white font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200 group-hover:border-orange-500">
                <span>로그인 화면으로 이동</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* 신규 회원 (온보딩 역할 선택 화면으로 이동 - Orange style restored) */}
            <Link
              href="/onboarding"
              className="group relative p-8 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center overflow-hidden border border-orange-400"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 shadow-xs backdrop-blur-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">신규 회원이신가요?</h2>
              <p className="text-xs sm:text-sm text-orange-100 mb-6 leading-relaxed break-keep">
                발주자 또는 외주 개발자 맞춤형 역할을 선택하고 3초 만에 시작하세요.
              </p>
              
              <div className="mt-auto w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-white">
                <span>역할 선택 및 시작하기</span>
                <span className="text-slate-900 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>

          {/* 데모 체험하기 우회 링크 */}
          <div className="mb-24 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 select-none">
            <span>가입 없이 워크스페이스 대시보드가 궁금하신가요?</span>
            <Link
              href="/demo/projects/quarterly-improvement"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition-all hover:scale-[1.03] shadow-xs border border-orange-200/50 cursor-pointer ml-1 active:scale-[0.98]"
            >
              <span>데모 체험하기</span>
              <span className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          {/* Interactive Web Dashboard Mockup Section */}
          <div className="w-full max-w-5xl text-left space-y-6 mb-24">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                비개발자 맞춤형 검수 대시보드 미리보기
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                복잡한 코드 대신 작동 기준의 성공/실패 여부, 재현 영상 증거로 직관적인 진척도를 확인합니다.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden flex flex-col">
              {/* Mock Browser Header */}
              <div className="bg-slate-100 px-5 py-3 flex items-center justify-between border-b border-slate-200">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-450"></span>
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg text-xs px-8 py-1 text-slate-500">
                  linkross.com/demo/projects/quarterly-improvement
                </div>
                <div className="w-12"></div>
              </div>

              {/* Mock Browser Body */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] min-h-[400px]">
                {/* Mock Sidebar */}
                <div className="bg-slate-50 border-r border-slate-200 p-4 space-y-6 hidden md:block">
                  <div className="space-y-2">
                    <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
                    <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-3 h-3 rounded-md bg-slate-200" /> Project SOW
                    </li>
                    <li className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded-lg">
                      <span className="w-3 h-3 rounded-md bg-orange-500" /> Milestones & Verification
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-3 h-3 rounded-md bg-slate-200" /> Payments & Evidence
                    </li>
                  </ul>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-6 space-y-6">
                  {/* Status Headline */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-400 uppercase">Milestone 1</h4>
                      <h3 className="font-semibold text-lg text-slate-900 mt-1">M1 · 웹페이지 로그인 분기 개선 (Login Branching Fix)</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">Passed</span>
                  </div>

                  {/* Checklist Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200 pb-2">
                      <span>Verification checklist</span>
                      <span>Playwright automated run</span>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        "이메일과 비밀번호를 입력할 수 있다. (Inputs are interactable)",
                        "정상 로그인 후 /dashboard로 이동한다. (Redirects to dashboard)",
                        "잘못된 비밀번호 입력 시 오류가 표시된다. (Handles invalid credentials)",
                        "이메일 미입력 시 로그인이 차단된다. (Validates empty fields)"
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                          <span className="text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {item}
                          </span>
                          <span className="text-green-600">Passed</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Simulator Trigger */}
                  <div className="flex gap-4">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                      <svg className="size-3.5 fill-orange-600" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Watch verification video
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg> View test screenshot
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Section */}
          <div className="w-full max-w-5xl text-left border-t border-slate-200 pt-16 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight">강력한 개발 도구 연동</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed break-keep">
                  GitHub 등 이미 사용 중인 개발 워크플로우에 LinKross의 실시간 검수가 자연스럽게 결합됩니다.
                </p>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Integration 1 */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 flex gap-4">
                  <div className="size-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-xs">
                    <svg className="size-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">GitHub Pull Request 연동</h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-500 leading-relaxed">
                      <li className="flex items-start gap-1 break-keep">
                        <span className="text-slate-400 select-none">•</span>
                        <span>PR 제출과 동시에 <strong>불변의 Commit SHA</strong>를 자동으로 고정합니다.</span>
                      </li>
                      <li className="flex items-start gap-1 break-keep">
                        <span className="text-slate-400 select-none">•</span>
                        <span>독립된 일회성 환경에서 안전하게 빌드 및 자동 테스트를 수행합니다.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Integration 2 */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 flex gap-4">
                  <div className="size-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-xs">
                    <svg className="size-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Vercel Sandbox 연동</h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-500 leading-relaxed">
                      <li className="flex items-start gap-1 break-keep">
                        <span className="text-slate-400 select-none">•</span>
                        <span>일회성 <strong>샌드박스 프리뷰 배포</strong>로 빌드 결과를 즉시 생성합니다.</span>
                      </li>
                      <li className="flex items-start gap-1 break-keep">
                        <span className="text-slate-400 select-none">•</span>
                        <span>브라우저에서 직접 결과물을 조작하며 시각 완성도를 검증할 수 있습니다.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-800">LinKross</span>
            <span>— B2B 프로젝트 검증 워크스페이스</span>
          </div>
          <div>© 2026 LinKross. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
