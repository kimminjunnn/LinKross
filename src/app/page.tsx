'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
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
          <span className="text-xs font-extrabold px-3.5 py-1.5 bg-orange-100 text-orange-600 rounded-full border border-orange-200 shadow-xs">
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
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-600 border border-orange-500/20 px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-8 shadow-xs backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            <span>초기 스타트업 및 대표님을 위한 외주 개발 통합 가이드</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-[1.35] sm:leading-[1.35] tracking-tight mb-8 break-keep">
            사내 CTO가 없어도 <br />
            <span className="text-orange-500">해외 외주 개발자와 완벽하게 협업</span>하세요
          </h1>

          {/* Sub description */}
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mb-14 leading-relaxed font-medium break-keep">
            <span className="text-slate-900 font-bold">개발 지식 없어도 괜찮습니다.</span>
            <br />
            <span className="text-orange-600 font-bold">개발자 선정부터 요구사항 정리, 작동하는 MVP 검수까지 한 곳에서.</span>
          </p>

          {/* 3 Value Proposition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-16">
            {/* Value 1: Domestic vs Offshore Freelancer Cost Reduction */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-orange-500/80 transition-all shadow-sm hover:shadow-md space-y-3.5">
              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-black text-xs">
                01. 비용 절감 & 외주 리스크 차단
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight break-keep">CTO 채용 없이 외주비 낭비 방지</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal break-keep">
                국내 프리랜서 대비 <strong className="text-orange-600 font-extrabold">해외 개발자 매칭으로 개발비 60% 절감</strong>, 사내 CTO/QA 채용 대비 <strong className="text-orange-600 font-extrabold">인건비를 70% 이상 절감</strong>하여 외주 리스크를 차단합니다.
              </p>
            </div>

            {/* Value 2: AI SOW Headline & Highlight Metric */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-orange-500/80 transition-all shadow-sm hover:shadow-md space-y-3.5">
              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-black text-xs">
                02. 비개발자 맞춤 소통 편의성
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight break-keep">어려운 업무명세서 작업, AI로 한 번에 해결하세요</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal break-keep">
                작성에 며칠씩 걸리던 SOW(업무명세서)를 <strong className="text-orange-600 font-extrabold">AI 자동 생성으로 작성 시간 90% 단축</strong>하고, 비개발자도 직관 확인 가능한 조건으로 합의합니다.
              </p>
            </div>

            {/* Value 3: Automated Verification Highlight Metric */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-orange-500/80 transition-all shadow-sm hover:shadow-md space-y-3.5">
              <div className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-black text-xs">
                03. 확실한 결과물 검수 & 승인
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight break-keep">작동 화면과 증거로 직접 승인</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal break-keep">
                코드를 읽지 못해도 괜찮습니다. <strong className="text-orange-600 font-extrabold">자동 판정 정확도 90%</strong>와 시연 영상 증거로 <strong className="text-orange-600 font-extrabold">검수 확인 시간을 30% 단축</strong>하여 안심 승인하세요.
              </p>
            </div>
          </div>

          {/* Member Selection CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* 기존 회원 (로그인 화면 /login 으로 이동) */}
            <Link
              href="/login"
              className="group relative p-8 bg-white border-2 border-slate-200 hover:border-orange-500 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center overflow-hidden text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-orange-100 text-slate-700 group-hover:text-orange-600 flex items-center justify-center mb-6 transition-colors duration-300 shadow-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mb-2">기존 회원이신가요?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed break-keep">
                로그인 화면으로 이동하여 내 프로젝트 진행 상황과 검수 내역을 확인하세요.
              </p>
              
              <div className="mt-auto w-full py-3 px-4 rounded-xl bg-slate-100 group-hover:bg-orange-500 text-slate-700 group-hover:text-white font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200 group-hover:border-orange-500">
                <span>로그인 화면으로 이동</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* 신규 회원 (온보딩 역할 선택 화면으로 이동 - White button with black text) */}
            <Link
              href="/onboarding"
              className="group relative p-8 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center overflow-hidden border border-orange-400"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 shadow-xs backdrop-blur-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>

              <h2 className="text-xl font-extrabold text-white mb-2">신규 회원이신가요?</h2>
              <p className="text-xs sm:text-sm text-orange-100 mb-6 leading-relaxed break-keep">
                발주자 또는 외주 개발자 맞춤형 역할을 선택하고 3초 만에 시작하세요.
              </p>
              
              <div className="mt-auto w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-white">
                <span>역할 선택 및 시작하기</span>
                <span className="text-slate-900 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">LinKross</span>
            <span>— B2B 프로젝트 검증 워크스페이스</span>
          </div>
          <div>© 2026 LinKross. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
