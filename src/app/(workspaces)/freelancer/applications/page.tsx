"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  FilePenLine, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { PageHeader } from "@/components/page/page-header";
import { OPPORTUNITIES, Opportunity } from "@/data/opportunities";

// Extend Opportunity type to support local application status
type ApplicationStatus = "draft" | "submitted" | "offer";

type ApplicationMock = {
  opportunity: Opportunity;
  status: ApplicationStatus;
  lastUpdated: string;
  proposedBudget?: string;
  proposedDuration?: string;
  submittedContent?: string;
};

export default function FreelancerApplicationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "submitted" | "offers">("all");
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Distribute the opportunities into different states for high-fidelity mockup experience
  const mockApplications: ApplicationMock[] = [
    {
      opportunity: OPPORTUNITIES[0], // Customer portal MVP
      status: "draft",
      lastUpdated: "Aug 12, 2026",
    },
    {
      opportunity: OPPORTUNITIES[1], // E-commerce Checkout
      status: "submitted",
      lastUpdated: "Aug 10, 2026",
      proposedBudget: "$17,500",
      proposedDuration: "10 weeks",
      submittedContent: "I have extensive experience building scalable checkout funnels with Stripe. My proposed solution uses Node.js backend transactional locks to guarantee zero overselling. I have already designed the DB schema draft."
    },
    {
      opportunity: OPPORTUNITIES[2], // B2B SaaS Analytics
      status: "offer",
      lastUpdated: "Aug 13, 2026",
      proposedBudget: "$15,000",
      proposedDuration: "8 weeks",
      submittedContent: "I can build the B2B SaaS Analytics dashboard with clean code and full roles/permission schema using PostgreSQL Row-Level Security (RLS). High-performance CSV parsing is guaranteed."
    }
  ];

  // Filtering applications by tab
  const filteredApps = mockApplications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "drafts") return app.status === "draft";
    if (activeTab === "submitted") return app.status === "submitted";
    if (activeTab === "offers") return app.status === "offer";
    return true;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 border border-amber-100">
            <FilePenLine className="size-3" /> Draft Available
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-accent-50 px-2 py-1 text-xs font-bold text-accent-700 border border-accent-100">
            <Send className="size-3" /> Under Review
          </span>
        );
      case "offer":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 border border-emerald-100 animate-pulse">
            <Sparkles className="size-3" /> Offer Received
          </span>
        );
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "draft":
        return <FilePenLine className="size-5 text-amber-600" />;
      case "submitted":
        return <Clock className="size-5 text-accent-600" />;
      case "offer":
        return <CheckCircle2 className="size-5 text-emerald-600" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Proposals & SOW Workspace"
        title="Proposals & SOW"
        description="Drafts, submitted proposals, and contract offers stay connected to the original project requirements."
        actions={
          <Link
            href="/opportunities"
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600 transition-all hover:translate-x-0.5 shadow-sm"
          >
            Find projects
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      {/* Modern Status Tabs (Contra Inspired) */}
      <div className="mt-8 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "all"
              ? "border-brand-500 text-brand-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All ({mockApplications.length})
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "drafts"
              ? "border-brand-500 text-brand-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Drafts ({mockApplications.filter(a => a.status === "draft").length})
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "submitted"
              ? "border-brand-500 text-brand-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Submitted ({mockApplications.filter(a => a.status === "submitted").length})
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "offers"
              ? "border-brand-500 text-brand-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Offers Received ({mockApplications.filter(a => a.status === "offer").length})
        </button>
      </div>

      {/* Applications list */}
      <div className="mt-6 space-y-4">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => {
            const isExpanded = expandedAppId === app.opportunity.id;
            return (
              <article
                key={app.opportunity.id}
                className={`overflow-hidden rounded-card border bg-white p-5 shadow-sm transition-all duration-300 ${
                  app.status === "offer" 
                    ? "border-emerald-200/80 shadow-emerald-50/40 bg-gradient-to-br from-white to-emerald-50/10" 
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                      app.status === "draft" ? "bg-amber-50" : 
                      app.status === "submitted" ? "bg-accent-50" : "bg-emerald-50"
                    }`}>
                      {getStatusIcon(app.status)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(app.status)}
                        <span className="text-xs text-slate-400 font-medium">Last active: {app.lastUpdated}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-black text-slate-900">{app.opportunity.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Client: <strong className="font-semibold">{app.opportunity.organization}</strong> · Budget: {app.opportunity.budget} · Apply by {app.opportunity.deadline}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons based on status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {app.status === "draft" && (
                      <Link
                        href={`/freelancer/applications/${app.opportunity.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-sm"
                      >
                        Write proposal
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
                    {app.status === "submitted" && (
                      <button
                        onClick={() => toggleExpand(app.opportunity.id)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50 text-slate-700 bg-white transition-all shadow-sm"
                      >
                        {isExpanded ? "Hide Details" : "View Proposal"}
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    )}
                    {app.status === "offer" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(app.opportunity.id)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50 text-slate-700 bg-white transition-all shadow-sm"
                        >
                          Details
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                        <Link
                          href={`/freelancer/applications/${app.opportunity.id}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-sm animate-pulse hover:animate-none"
                        >
                          Review SOW & Sign
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposal Detail Dropdown (Linear / Upwork style) */}
                {isExpanded && (
                  <div className="mt-5 border-t border-slate-100 pt-5 space-y-4 animate-fadeIn">
                    <div className="grid gap-4 md:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">PROPOSED BUDGET</span>
                        <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                          <DollarSign className="size-4 text-slate-400" />
                          {app.proposedBudget || app.opportunity.budget} (Fixed Price)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">PROPOSED DURATION</span>
                        <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                          <Calendar className="size-4 text-slate-400" />
                          {app.proposedDuration || app.opportunity.duration}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="size-4 text-slate-400" />
                        Submitted Proposal Text
                      </h4>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-600 leading-relaxed italic">
                        "{app.submittedContent}"
                      </div>
                    </div>

                    {app.status === "offer" && (
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2.5">
                        <AlertCircle className="size-4.5 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="font-bold">Client has approved your proposal and generated a Draft SOW.</p>
                          <p className="mt-1 leading-relaxed text-emerald-700/90">
                            Please click <strong className="font-extrabold">"Review SOW & Sign"</strong> to examine the locked Acceptance Criteria, milestones distribution, and complete the binding agreement to start working on GitHub.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-card border border-slate-200 shadow-sm">
            <AlertCircle className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">No applications here</h3>
            <p className="mt-2 text-sm text-slate-500">
              There are no applications matching the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
