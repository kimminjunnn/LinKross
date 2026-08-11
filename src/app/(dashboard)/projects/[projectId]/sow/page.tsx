import { Check, Sparkles } from "lucide-react";

const milestones = [
  { code: "M1", title: "초기 시스템 구현", period: "08.10 – 08.20", amount: "1,000 USDC" },
  { code: "M2", title: "핵심 기능 · 결과물", period: "08.21 – 09.01", amount: "1,200 USDC" },
  { code: "M3", title: "문서화 · 인수인계", period: "09.02 – 09.14", amount: "800 USDC" },
];

export default function SowPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div>
          <p className="text-xs font-bold tracking-[0.1em] text-brand-700 uppercase">Owner · 업무 정의</p>
          <h2 className="mt-2 text-xl font-black text-app-foreground">한국어 업무 명세서</h2>
          <p className="mt-2 text-sm leading-6 text-app-muted">발주자가 원본 요구사항과 완료 조건을 작성하는 영역입니다.</p>
        </div>

        <label className="mt-6 block text-sm font-bold text-app-foreground" htmlFor="work-detail">업무 상세</label>
        <textarea
          id="work-detail"
          className="mt-2 min-h-44 w-full resize-y rounded-control border border-app-border bg-app-surface-subtle p-4 text-sm leading-6 outline-none focus:border-brand-400"
          defaultValue="고객이 로그인 후 계약 및 진행 현황을 확인할 수 있는 포털 MVP를 구현합니다."
        />

        <button type="button" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-control bg-app-foreground px-4 text-sm font-bold text-white">
          <Sparkles aria-hidden="true" className="size-4" />
          AI 분석
        </button>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-app-foreground">마일스톤 설정</h3>
            <p className="mt-1 text-xs leading-5 text-app-muted">AI 초안을 사람이 검토하고 직접 수정합니다.</p>
          </div>
          <span className="text-xs font-semibold text-app-muted">합계 3,000 USDC</span>
        </div>

        <div className="mt-3 space-y-2">
          {milestones.map((milestone) => (
            <article key={milestone.code} className="rounded-control border border-app-border bg-app-surface-subtle p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-app-foreground">{milestone.code} · {milestone.title}</strong>
                <div className="flex gap-3 text-xs font-semibold text-app-muted">
                  <span>{milestone.period}</span>
                  <span className="text-app-foreground">{milestone.amount}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-app-muted">DoD · 합의한 기능 동작 및 자동 테스트 통과</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="min-h-11 flex-1 rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600">AI 영문 명세서 생성</button>
          <button type="button" className="min-h-11 rounded-control border border-app-border-strong px-4 text-sm font-bold text-app-foreground">임시 저장</button>
        </div>
      </section>

      <section className="rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.1em] text-accent-700 uppercase">Owner · AI 초안 / 공동 검토</p>
            <h2 className="mt-2 text-xl font-black text-app-foreground">영문 업무 명세서</h2>
          </div>
          <span className="rounded-pill bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-800">Draft v1</span>
        </div>

        <div className="mt-6 rounded-control border border-app-border bg-app-surface-subtle p-5">
          {["Purpose", "Scope of Work", "Detailed Tasks & Deliverables", "Timeline & Milestones", "Acceptance Criteria", "Definition of Done"].map((section, index) => (
            <div key={section} className={index ? "mt-5" : ""}>
              <h3 className="text-sm font-black text-app-foreground">{index + 1}. {section}</h3>
              <div className="mt-2 space-y-2" aria-hidden="true">
                <div className="h-2 rounded-pill bg-app-border" />
                <div className="h-2 w-4/5 rounded-pill bg-app-border" />
              </div>
            </div>
          ))}
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm font-bold text-app-foreground">
          <input type="checkbox" defaultChecked className="size-4 accent-brand-500" />
          한국어 원문과 대조 검토 완료
        </label>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-app-muted">
          <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
          AI는 초안을 돕고, 양측의 명시적 승인이 공식 합의가 됩니다.
        </p>

        <button type="button" className="mt-5 min-h-11 w-full rounded-control bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600">개발자 승인 요청</button>
      </section>
    </div>
  );
}
