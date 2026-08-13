"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  BadgeCheck,
  Sparkles,
  Search,
  ExternalLink
} from "lucide-react";

import { PageHeader } from "@/components/page/page-header";

export default function FreelancerProjectsListPage() {
  // Sample active projects representing list view
  const activeProjects = [
    {
      id: "customer-portal-mvp",
      title: "Customer portal MVP",
      client: "Crosslab",
      budget: "$12,000",
      progress: "1/3 milestones completed",
      lastActive: "Aug 13, 2026",
      description: "Build a secure customer portal with email sign-in, account access, and a small operations dashboard. Verified requirements evaluated via automated Playwright test suites.",
      tech: ["Next.js", "Node.js", "PostgreSQL", "Playwright"]
    }
  ];

  // Completed projects (Past contracts)
  const completedProjects = [
    {
      id: "api-gateway-integration",
      title: "API Gateway Integration Suite",
      client: "ShopVibe",
      budget: "$8,500",
      completedAt: "July 24, 2026",
      evidenceHash: "0x8fa3f2c99aeb",
      description: "Implemented custom API gateway routes, request throttling middlewares, and unified error handler wrappers."
    }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <PageHeader
        eyebrow="Developer Workspace"
        title="My Projects"
        description="Browse your active and past development contracts on LinKross."
      />

      {/* Section 1: Active Projects List (Horizontal Layout) */}
      <div className="mt-8 space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="size-4 text-brand-500" /> Active Contracts ({activeProjects.length})
        </h3>

        {activeProjects.map((project) => (
          <div 
            key={project.id}
            className="group relative overflow-hidden bg-white border border-slate-200 rounded-card p-6 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-300"
          >
            {/* Top orange gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 opacity-80" />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-3.5">
                {/* Meta details */}
                <div className="flex items-center flex-wrap gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-lg bg-orange-100 font-black text-xs text-brand-700 uppercase">
                    {project.client.charAt(0)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {project.client}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-750 border border-brand-100">
                    <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
                    Active Contract
                  </span>
                </div>

                {/* Title and description */}
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                  {project.title}
                </h2>
                <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                  {project.description}
                </p>

                {/* Tech tags and progress indicators */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  {project.tech.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                      {tag}
                    </span>
                  ))}
                  <span className="hidden sm:inline size-1 rounded-full bg-slate-300 mx-1" />
                  <span className="text-xs text-slate-450 font-semibold">
                    Progress: <strong className="text-slate-700 font-black">{project.progress}</strong>
                  </span>
                </div>
              </div>

              {/* Budget and Orange Action Button */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 shrink-0">
                <div className="bg-slate-50 border border-slate-105 p-4 rounded-xl min-w-[200px] shadow-sm text-left lg:text-right">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Contract Value</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{project.budget}</span>
                </div>

                <Link
                  href={`/freelancer/projects/${project.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-gradient-to-r from-brand-500 to-orange-600 px-6 text-sm font-bold text-white hover:from-brand-600 hover:to-orange-700 transition-all hover:translate-x-1 duration-200 shadow-md"
                >
                  View Workspace
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Completed Contracts (Past contracts list) */}
      <div className="mt-12 space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <BadgeCheck className="size-4 text-emerald-600" /> Completed Contracts ({completedProjects.length})
        </h3>

        {completedProjects.map((project) => (
          <div 
            key={project.id}
            className="bg-white border border-slate-200/80 rounded-card p-6 shadow-sm hover:border-slate-350 transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-lg bg-emerald-50 font-black text-xs text-emerald-700 uppercase">
                    {project.client.charAt(0)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {project.client}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                    Released & Completed
                  </span>
                </div>

                <h4 className="text-lg font-black text-slate-800">{project.title}</h4>
                <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">{project.description}</p>
                
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-150 mt-1">
                  <BadgeCheck className="size-3.5 text-brand-500" />
                  <span>QA Hash: <strong className="text-slate-600 font-bold">{project.evidenceHash}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 lg:self-center">
                <div className="text-left lg:text-right pr-4 border-r border-slate-150">
                  <span className="text-xs text-slate-400 block font-medium">Released Value</span>
                  <span className="text-lg font-black text-slate-900">{project.budget}</span>
                </div>
                
                <button className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-slate-200 bg-white px-4 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-all shadow-sm">
                  View Evidence Pack
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
