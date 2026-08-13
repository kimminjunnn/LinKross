"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  Sparkles,
  DollarSign,
  Send,
  UserCheck,
  Terminal
} from "lucide-react";

export default function FreelancerHomePage() {
  // Original active freelancer stats (mainly brand-orange theme)
  const stats = [
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

  // Getting Started Onboarding Steps (Connect GitHub, Setup Profile, Find Projects)
  const onboardingSteps = [
    {
      id: "step-github",
      title: "Connect your GitHub Account",
      description: "LinKross runs automated Playwright validation runners on your commits. Connect GitHub to sync repositories.",
      status: "action",
      actionText: "Link GitHub",
      href: "/freelancer/settings",
      icon: Terminal,
      color: "border-brand-100 bg-brand-50/10 text-brand-700"
    },
    {
      id: "step-profile",
      title: "Complete your Technical Profile",
      description: "Fill in your stack (e.g. Next.js, Node.js) and experience. Startups select partners based on proposal quality.",
      status: "pending",
      actionText: "Edit Profile",
      href: "/freelancer/settings",
      icon: UserCheck,
      color: "border-slate-100 bg-slate-50/30 text-slate-600"
    },
    {
      id: "step-find",
      title: "Browse Verified Projects",
      description: "Find requirements with pre-defined milestone budgets. Pitch your implementation plan to start SOW drafting.",
      status: "pending",
      actionText: "Find Projects",
      href: "/opportunities",
      icon: Search,
      color: "border-slate-100 bg-slate-50/30 text-slate-600"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      
      {/* Personalized Welcome Header with Elegant Accents */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-pill bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 uppercase tracking-wider mb-2">
            <Sparkles className="size-3 text-brand-600" /> Freelancer Workspace
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-orange-500">Jieun</span> 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is a summary of your active proposals, code verifications, and earnings.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-150 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            GitHub Connected
          </span>
        </div>
      </div>

      {/* Real-time Stats Grid (High-Fidelity Dashboard Row) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className="group relative overflow-hidden bg-white border border-slate-200/80 rounded-card p-5 shadow-sm hover:shadow-lg hover:border-brand-300/80 hover:translate-y-[-3px] transition-all duration-300"
            >
              {/* Premium top accent line matching the lower grid */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 opacity-80" />
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block tracking-wide">{stat.label}</span>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block font-medium">{stat.sub}</span>
                </div>
                <span className={`size-11 rounded-xl grid place-items-center border transition-transform duration-300 group-hover:scale-105 ${stat.color}`}>
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Getting Started: Complete your Setup (Permanent Onboarding checklist) */}
      <section className="bg-white border border-slate-200 rounded-card p-6 sm:p-7 shadow-sm relative overflow-hidden mt-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-orange-400 opacity-80" />
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
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-md hover:border-brand-200 ${step.color}`}
              >
                <div className="space-y-2">
                  <span className="size-10 rounded-lg bg-white border border-slate-100 grid place-items-center shadow-sm">
                    <StepIcon className="size-5 text-slate-700" />
                  </span>
                  <h4 className="text-sm font-black text-slate-800 mt-2">{step.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                </div>

                <Link
                  href={step.href}
                  style={
                    step.status === "action"
                      ? { backgroundColor: "#0f172a", color: "#ffffff" }
                      : { backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }
                  }
                  className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-control text-xs font-black border transition-all hover:opacity-90 shadow-sm"
                >
                  {step.actionText}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
      
    </div>
  );
}
