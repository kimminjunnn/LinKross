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
  Sparkles,
  HelpCircle
} from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { OPPORTUNITIES } from "@/data/opportunities";

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>("customer-portal-mvp");

  // Get all unique skills for filter badges
  const allSkills = Array.from(
    new Set(OPPORTUNITIES.flatMap((opp) => opp.skills))
  );

  // Filter opportunities based on search query and selected skill tag
  const filteredOpportunities = OPPORTUNITIES.filter((opp) => {
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
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] text-app-foreground pb-20">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <BrandLogo />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/opportunities" className="text-brand-600 font-bold">Find Projects</Link>
              <Link href="/freelancer/applications" className="hover:text-brand-600 transition-colors">My Applications</Link>
              <Link href="#" className="hover:text-brand-600 transition-colors">Messages</Link>
              <Link href="#" className="hover:text-brand-600 transition-colors">Payments</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login?role=freelancer&next=/freelancer"
              className="rounded-control border border-slate-300 hover:border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              Freelancer Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Dynamic & Engaging Hero Section */}
        <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b border-slate-200 pb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-pill bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 mb-4 animate-pulse">
              <Sparkles className="size-3.5" />
              Verified Workspace Enabled
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
              Find projects with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-orange-500">clear scope</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-teal-500">automated verification</span>.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Review verified requirements and SOW parameters before you even apply. 
              LinKross guarantees automated verification of deliverables based on strict Acceptance Criteria.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects, clients or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-control border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedSkill(null)}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedSkill === null
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                  {/* Decorative Gradient Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500" />
                  
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
                              className="rounded-pill bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200/60"
                            >
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right Control Box */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
                        <div className="text-left lg:text-right bg-slate-50 border border-slate-100 p-4 rounded-xl min-w-[200px] shadow-inner">
                          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
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
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-6 text-sm font-bold text-white hover:bg-brand-600 transition-all hover:translate-x-1 duration-200 shadow-sm"
                        >
                          View Details
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 border-t border-slate-100 pt-5 text-xs text-slate-400 font-medium">
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
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
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
                            <ShieldCheck className="size-4 text-accent-600" />
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
      </main>
    </div>
  );
}
