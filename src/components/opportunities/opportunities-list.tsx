"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  CalendarDays, 
  Clock3, 
  WalletCards, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ShieldCheck,
  HelpCircle
} from "lucide-react";

type Opportunity = {
  id: string;
  title: string;
  organization: string;
  budget: string;
  duration: string;
  deadline: string;
  summary: string;
  skills: readonly string[];
  requirements: readonly string[];
  support: readonly string[];
};

export function OpportunitiesList({ opportunities }: { opportunities: readonly Opportunity[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>("customer-portal-mvp");

  // Get all unique skills for filter badges
  const allSkills = Array.from(
    new Set(opportunities.flatMap((opp) => opp.skills))
  );

  // Filter opportunities based on search query and selected skill tag
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkill = selectedSkill ? opp.skills.includes(selectedSkill) : true;
    
    return matchesSearch && matchesSkill;
  });

  const toggleExpand = (id: string) => {
    setExpandedOpportunityId(expandedOpportunityId === id ? null : id);
  };

  return (
    <>
      {/* Filter & Search Bar */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, clients or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-control border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-405 focus:border-brand-500 focus:bg-white focus:outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedSkill(null)}
            className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
              selectedSkill === null
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-650 hover:bg-slate-200"
            }`}
          >
            All Skills
          </button>
          {allSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedSkill === skill
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Project Lists */}
      <div className="mt-8 space-y-6">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opportunity) => {
            const isExpanded = expandedOpportunityId === opportunity.id;
            return (
              <article
                key={opportunity.id}
                className="group relative overflow-hidden rounded-card border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Decorative Gradient Bar matching stats grid */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 opacity-80" />
                
                <div className="p-6 sm:p-8">
                  {/* Header Info */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-orange-100 font-black text-xs text-brand-700 uppercase">
                          {opportunity.organization.charAt(0)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {opportunity.organization}
                        </span>
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-accent-50 px-2 py-0.5 text-[10px] font-bold text-accent-700 border border-accent-100">
                          <ShieldCheck className="size-3" /> Playwright Testable
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                        {opportunity.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
                        {opportunity.summary}
                      </p>
                      
                      {/* Skills / Tech stack Badges */}
                      <ul className="mt-5 flex flex-wrap gap-1.5">
                        {opportunity.skills.map((skill) => (
                          <li
                            key={skill}
                            className="rounded-pill bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-650 border border-slate-200/60"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right Control Box */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
                      <div className="text-left lg:text-right bg-slate-50 border border-slate-105 p-4 rounded-xl min-w-[200px] shadow-sm">
                        <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                          <span>Budget</span>
                          <span>Duration</span>
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-lg font-black text-slate-900">{opportunity.budget}</span>
                          <span className="text-sm font-bold text-slate-700">{opportunity.duration}</span>
                        </div>
                      </div>

                      <Link
                        href={`/opportunities/${opportunity.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-gradient-to-r from-brand-500 to-orange-600 px-6 text-sm font-bold text-white hover:from-brand-600 hover:to-orange-700 transition-all hover:translate-x-1 duration-200 shadow-md"
                      >
                        View Details
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 border-t border-slate-100 pt-5 text-xs text-slate-450 font-bold">
                    <div className="flex items-center gap-1.5">
                      <WalletCards className="size-4 text-slate-400" />
                      <span>Fixed Price Contract</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="size-4 text-slate-400" />
                      <span>8-10 weeks delivery</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-slate-400" />
                      <span>Apply by {opportunity.deadline}</span>
                    </div>
                  </div>

                  {/* Expandable Milestones / Acceptance Criteria (Linear Style) */}
                  <div className="mt-5 border-t border-slate-100/80 pt-4">
                    <button
                      onClick={() => toggleExpand(opportunity.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-650 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-4" />
                          Hide Verified Requirements
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-4" />
                          Show Verified Requirements ({opportunity.requirements.length})
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-all duration-300 animate-fadeIn">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <ShieldCheck className="size-4 text-accent-650" />
                          Scope / Acceptance Criteria (Definition of Done)
                        </h4>
                        <ul className="space-y-3">
                          {opportunity.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-500" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Synthetic Support Check list */}
                        <div className="mt-5 pt-4 border-t border-slate-200/60">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Provided by Client:
                          </h5>
                          <div className="flex flex-wrap gap-y-1.5 gap-x-4">
                            {opportunity.support.map((item, index) => (
                              <span key={index} className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <span className="size-1 rounded-full bg-slate-400" />
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </article>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-card border border-slate-200 shadow-sm">
            <HelpCircle className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">No projects found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your search terms or filter buttons.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
