"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  HelpCircle,
  Search,
  WalletCards,
} from "lucide-react";

import type { OpportunitySummary } from "@/lib/backend/contracts";
import {
  formatBudget,
  formatProjectDate,
  formatProjectPeriod,
  technologyTags,
} from "@/lib/opportunities/presentation";

export function OpportunitiesList({
  opportunities,
}: {
  opportunities: readonly OpportunitySummary[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(null);

  const allTechnologies = Array.from(
    new Set(opportunities.flatMap((opportunity) => technologyTags(opportunity.technology))),
  );
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredOpportunities = opportunities.filter((opportunity) => {
    const searchableText = [
      opportunity.title,
      opportunity.goal,
      opportunity.organizationName,
      opportunity.technology ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase();
    const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesTechnology = selectedTechnology
      ? technologyTags(opportunity.technology).includes(selectedTechnology)
      : true;

    return matchesSearch && matchesTechnology;
  });

  if (opportunities.length === 0) {
    return (
      <div className="mt-8 rounded-card border border-slate-200 bg-white py-16 text-center shadow-sm">
        <HelpCircle className="mx-auto size-10 text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">현재 모집 중인 프로젝트가 없습니다</h2>
        <p className="mt-2 text-sm text-slate-500">새 프로젝트가 등록되면 이곳에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="프로젝트명, 기업명 또는 기술 검색"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-control border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-405 transition-all focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        {allTechnologies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedTechnology(null)}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedTechnology === null
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              전체 기술
            </button>
            {allTechnologies.map((technology) => (
              <button
                type="button"
                key={technology}
                onClick={() => setSelectedTechnology(technology)}
                className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedTechnology === technology
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                }`}
              >
                {technology}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opportunity) => {
            const technologies = technologyTags(opportunity.technology);

            return (
              <article
                key={opportunity.id}
                className="group relative overflow-hidden rounded-card border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 opacity-80" />

                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-black text-brand-700 uppercase">
                          {opportunity.organizationName.charAt(0)}
                        </span>
                        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                          {opportunity.organizationName}
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black text-slate-900 transition-colors group-hover:text-brand-600">
                        {opportunity.title}
                      </h2>
                      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
                        {opportunity.goal}
                      </p>

                      {technologies.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-1.5">
                          {technologies.map((technology) => (
                            <li
                              key={technology}
                              className="rounded-pill border border-slate-200/60 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-650"
                            >
                              {technology}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                      <div className="min-w-[220px] rounded-xl border border-slate-105 bg-slate-50 p-4 text-left shadow-sm lg:text-right">
                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">예산</p>
                        <p className="mt-1.5 text-lg font-black text-slate-900">
                          {formatBudget(
                            opportunity.budgetAmount,
                            opportunity.budgetMaxAmount,
                            opportunity.budgetType,
                            opportunity.currency,
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/opportunities/${opportunity.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-gradient-to-r from-brand-500 to-orange-600 px-6 text-sm font-bold text-white shadow-md transition-all duration-200 hover:translate-x-1 hover:from-brand-600 hover:to-orange-700"
                      >
                        상세 보기
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-5 text-xs font-bold text-slate-450">
                    <div className="flex items-center gap-1.5">
                      <WalletCards className="size-4 text-slate-400" />
                      <span>{opportunity.budgetType === "range" ? "예산 범위" : "고정 예산"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="size-4 text-slate-400" />
                      <span>{formatProjectPeriod(opportunity.startDate, opportunity.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-slate-400" />
                      <span>지원 마감 {formatProjectDate(opportunity.recruitmentEndAt)}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-card border border-slate-200 bg-white py-16 text-center shadow-sm">
            <HelpCircle className="mx-auto size-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">검색 결과가 없습니다</h2>
            <p className="mt-2 text-sm text-slate-500">검색어나 기술 필터를 변경해보세요.</p>
          </div>
        )}
      </div>
    </>
  );
}
