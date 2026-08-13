"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  BriefcaseBusiness, 
  Search, 
  ShieldCheck, 
  Sparkles,
  DollarSign,
  Clock,
  Send,
  AlertTriangle,
  FileCode2,
  BadgeCheck,
  UserCheck,
  CheckCircle2,
  Terminal
} from "lucide-react";

export default function FreelancerHomePage() {
  // Toggle state to switch between "Active Freelancer (Jieun)" and "New Signup" modes
  const [isNewUser, setIsNewUser] = useState(false);

  // Stats data based on active or new user mode
  const stats = isNewUser ? [
    { 
      label: "Total Earnings", 
      value: "$0", 
      sub: "No milestones paid yet", 
      icon: DollarSign, 
      color: "text-slate-400 bg-slate-50 border-slate-200" 
    },
    { 
      label: "Active Contracts", 
      value: "0", 
      sub: "No active projects", 
      icon: ShieldCheck, 
      color: "text-slate-400 bg-slate-50 border-slate-200" 
    },
    { 
      label: "Proposals Submitted", 
      value: "0", 
      sub: "Start applying", 
      icon: Send, 
      color: "text-slate-400 bg-slate-50 border-slate-200" 
    },
    { 
      label: "Offers Pending", 
      value: "0", 
      sub: "No client offers", 
      icon: Sparkles, 
      color: "text-slate-400 bg-slate-50 border-slate-200" 
    },
  ] : [
    { 
      label: "Total Earnings", 
      value: "$2,400", 
      sub: "1 Milestone Paid", 
      icon: DollarSign, 
      color: "text-brand-600 bg-brand-50 border-brand-105" 
    },
    { 
      label: "Active Contracts", 
      value: "1", 
      sub: "Customer portal MVP", 
      icon: ShieldCheck, 
      color: "text-brand-600 bg-brand-50 border-brand-105" 
    },
    { 
      label: "Proposals Submitted", 
      value: "1", 
      sub: "Under Review", 
      icon: Send, 
      color: "text-brand-600 bg-brand-50 border-brand-105" 
    },
    { 
      label: "Offers Pending", 
      value: "1", 
      sub: "Action Required", 
      icon: Sparkles, 
      color: "text-brand-600 bg-brand-50 border-brand-105" 
    },
  ];

  const urgentActions = [
    {
      id: "action-sow",
      title: "Review SOW & Sign Contract Offer",
      project: "B2B SaaS Analytics Dashboard (MetricFlow)",
      description: "The client has accepted your proposal. Please review the locked SOW and sign the contract to start work on GitHub.",
      type: "offer",
      badge: "Pending Signature",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      buttonText: "Review & Sign",
      href: "/freelancer/applications"
    },
    {
      id: "action-test-fail",
      title: "Resolve failing Playwright validation on Milestone 2",
      project: "Customer portal MVP (Crosslab)",
      description: "Last test run on Commit a8f3b2c failed at 'Redirect logic to /dashboard'. Fix the assertion timeout to release the $4,800 payout.",
      type: "error",
      badge: "Action Required",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      buttonText: "View Dev Logs",
      href: "/freelancer/projects"
    }
  ];

  // Getting Started Steps for New Freelancers (Onboarding check list)
  const onboardingSteps = [
    {
      id: "step-github",
      title: "Connect your GitHub Account",
      description: "LinKross runs automated Playwright validation runners on your commits. Connect GitHub to sync repositories.",
      status: "action",
      actionText: "Link GitHub",
      icon: Terminal,
      color: "border-brand-100 bg-brand-50/10 text-brand-700"
    },
    {
      id: "step-profile",
      title: "Complete your Technical Profile",
      description: "Fill in your stack (e.g. Next.js, Node.js) and experience. Startups select partners based on proposal quality.",
      status: "pending",
      actionText: "Edit Profile",
      icon: UserCheck,
      color: "border-slate-100 bg-slate-50/30 text-slate-600"
    },
    {
      id: "step-find",
      title: "Browse Verified Projects",
      description: "Find requirements with pre-defined milestone budgets. Pitch your implementation plan to start SOW drafting.",
      status: "pending",
      actionText: "Find Projects",
      icon: Search,
      color: "border-slate-100 bg-slate-50/30 text-slate-600"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      
      {/* Demo Switcher Toggle at the very top (Premium style) */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
          <button 
            onClick={() => setIsNewUser(false)}
            className={`rounded-md px-3 py-1 font-bold transition-all ${
              !isNewUser ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Active Freelancer (Jieun)
          </button>
          <button 
            onClick={() => setIsNewUser(true)}
            className={`rounded-md px-3 py-1 font-bold transition-all ${
              isNewUser ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            New Signup (Empty State)
          </button>
        </div>
      </div>

      {/* Personalized Welcome Header with Elegant Accents */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-pill bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 uppercase tracking-wider mb-2">
            <Sparkles className="size-3 text-brand-600" /> Freelancer Workspace
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">
            {isNewUser ? (
              <>Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-orange-500">LinKross</span> 👋</>
            ) : (
              <>Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-orange-500">Jieun</span> 👋</>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isNewUser 
              ? "Get started by linking GitHub, configuring your stack, and submitting execution proposals."
              : "Here is a summary of your active proposals, code verifications, and earnings."
            }
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          {isNewUser ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700 border border-amber-150 shadow-sm">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Setup Incomplete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-150 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              GitHub Connected
            </span>
          )}
        </div>
      </div>

      {/* Real-time Stats Grid (High-Fidelity Dashboard Row) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className={`group relative overflow-hidden bg-white border rounded-card p-5 shadow-sm transition-all duration-300 ${
                isNewUser 
                  ? "border-slate-200 opacity-80" 
                  : "border-slate-200/80 hover:shadow-lg hover:border-brand-300/80 hover:translate-y-[-3px]"
              }`}
            >
              {/* Premium top accent line matching the lower grid */}
              {!isNewUser && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 opacity-80" />
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block tracking-wide">{stat.label}</span>
                  <span className={`text-2xl font-black block mt-1.5 transition-colors ${
                    isNewUser ? "text-slate-400" : "text-slate-900 group-hover:text-brand-600"
                  }`}>
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block font-medium">{stat.sub}</span>
                </div>
                <span className={`size-11 rounded-xl grid place-items-center border transition-transform duration-300 ${
                  !isNewUser ? "group-hover:scale-105" : ""
                } ${stat.color}`}>
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Workspace Navigation Grid (Contra & Vercel Inspired) */}
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <FileCode2 className="size-4 text-brand-500" /> Workspace Navigation
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          {
            icon: Search,
            title: "Find projects",
            description: "Browse verified requirements, budgets, and submit proposals.",
            href: "/opportunities",
            color: "text-brand-600 bg-brand-50/50 border-brand-100/60"
          },
          {
            icon: BriefcaseBusiness,
            title: "Proposals & SOW",
            description: "Edit active drafts, check proposal status, and sign client SOW offers.",
            href: "/freelancer/applications",
            color: "text-brand-600 bg-brand-50/50 border-brand-100/60"
          },
          {
            icon: ShieldCheck,
            title: "Deliveries & QA",
            description: "Access Playwright build runners, deploy logs, and invoice summaries.",
            href: "/freelancer/projects",
            color: "text-brand-600 bg-brand-50/50 border-brand-100/60"
          },
          {
            icon: BadgeCheck,
            title: "Invoices & Evidence",
            description: "Download compliance evidence packs, tax receipts, and release statements.",
            href: "/freelancer/invoices",
            color: "text-brand-600 bg-brand-50/50 border-brand-100/60"
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group relative overflow-hidden rounded-card border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-brand-300/80 hover:shadow-lg hover:translate-y-[-3px] flex flex-col justify-between"
            >
              <div>
                {/* Premium top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 opacity-80" />

                <span className={`size-11 rounded-xl grid place-items-center border ${item.color} group-hover:scale-105 transition-all`}>
                  <Icon className="size-5.5" />
                </span>
                <h2 className="mt-4 text-base font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                  {item.title}
                </h2>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
              
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-brand-600 group-hover:text-brand-700 group-hover:underline transition-colors">
                Open Workspace 
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dynamic Urgent Actions Panel OR Setup Guide depending on isNewUser */}
      {isNewUser ? (
        <section className="bg-white border border-slate-200 rounded-card p-6 sm:p-7 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-brand-500" />
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-2">
            <Sparkles className="size-5 text-amber-500" />
            Getting Started: Complete your Setup
          </h3>
          <p className="text-xs text-slate-400 mb-6 font-medium">Follow these steps to sign your first contract and start auto-validated development on LinKross.</p>

          <div className="grid gap-4 md:grid-cols-3">
            {onboardingSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div 
                  key={step.id} 
                  className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${step.color}`}
                >
                  <div className="space-y-2">
                    <span className="size-10 rounded-lg bg-white border border-slate-100 grid place-items-center shadow-sm">
                      <StepIcon className="size-5 text-slate-700" />
                    </span>
                    <h4 className="text-sm font-black text-slate-800 mt-2">{step.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                  </div>

                  <button
                    className={`inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-control text-xs font-bold transition-all ${
                      step.status === "action"
                        ? "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                        : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
                    }`}
                  >
                    {step.actionText}
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-card p-6 sm:p-7 shadow-sm relative overflow-hidden">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-5">
            <AlertTriangle className="size-5 text-amber-500" />
            Urgent Actions Required
          </h3>

          <div className="space-y-4">
            {urgentActions.map((action) => (
              <div 
                key={action.id} 
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/50 ${
                  action.type === "offer" ? "border-purple-100 bg-purple-50/10" : "border-red-100 bg-red-50/10"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{action.project}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 mt-1">{action.title}</h4>
                  <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">{action.description}</p>
                </div>

                <Link
                  href={action.href}
                  style={
                    action.type === "offer"
                      ? { backgroundColor: "#faf5ff", color: "#7e22ce", borderColor: "#e9d5ff" }
                      : { backgroundColor: "#fff7ed", color: "#c2410c", borderColor: "#ffedd5" }
                  }
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control px-4 text-xs font-black border transition-all shrink-0 hover:opacity-90 shadow-sm"
                >
                  {action.buttonText}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
