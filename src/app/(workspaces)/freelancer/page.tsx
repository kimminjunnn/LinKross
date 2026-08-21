import Link from "next/link";
import { ArrowRight, CircleAlert, FileText, FolderKanban, Receipt, Search, Send } from "lucide-react";

import { COMMISSION_ENFORCEMENT_ENABLED, COMMISSION_GRACE_DAYS } from "@/config/commission-status";
import { listFreelancerApplications, listFreelancerCommissionCharges, listFreelancerInvoices, listFreelancerProjects } from "@/lib/backend";
import { getCurrentUserDisplay } from "@/lib/profile-display";

export default async function FreelancerHomePage() {
  const [applications, projects, invoices, commissionCharges, display] = await Promise.all([
    listFreelancerApplications(),
    listFreelancerProjects(),
    listFreelancerInvoices(),
    listFreelancerCommissionCharges(),
    getCurrentUserDisplay("freelancer"),
  ]);
  const error = !applications.ok ? applications.error : !projects.ok ? projects.error : !invoices.ok ? invoices.error : !commissionCharges.ok ? commissionCharges.error : null;

  if (error) return <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm font-bold text-danger"><CircleAlert className="size-5 shrink-0" />{error.message}</div>;
  if (!applications.ok || !projects.ok || !invoices.ok || !commissionCharges.ok) return null;

  const pendingApplications = applications.data.filter((item) => item.status === "submitted").length;
  const pendingInvoices = invoices.data.filter((item) => item.status === "submitted").length;
  const now = new Date().getTime();
  const overdueCharges = commissionCharges.data.filter((charge) => charge.status === "pending" && new Date(charge.dueAt).getTime() < now);
  const graceExpired = overdueCharges.some((charge) => new Date(charge.dueAt).getTime() < now - COMMISSION_GRACE_DAYS * 86_400_000);
  const unpaidCommissionTotal = commissionCharges.data
    .filter((charge) => charge.status === "pending")
    .reduce((sum, charge) => sum + charge.commissionAmount + charge.vatAmount, 0);
  const stats = [
    { label: "Proposals submitted", value: applications.data.length, detail: `${pendingApplications} under review`, icon: Send, href: "/freelancer/applications" },
    { label: "Selected projects", value: projects.data.length, detail: `${projects.data.reduce((sum, project) => sum + project.milestoneCount, 0)} milestones`, icon: FolderKanban, href: "/freelancer/projects" },
    { label: "Invoices submitted", value: invoices.data.length, detail: `${pendingInvoices} awaiting review`, icon: FileText, href: "/freelancer/invoices" },
    { label: "Commission owed", value: unpaidCommissionTotal.toLocaleString(), detail: `${commissionCharges.data.filter((charge) => charge.status === "pending").length} unpaid`, icon: Receipt, href: "/freelancer/commissions" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <p className="text-xs font-black tracking-[0.12em] text-brand-700 uppercase">Freelancer workspace</p>
      <h1 className="mt-2 text-3xl font-black text-app-foreground flex items-center gap-2">
        <span>Welcome back, {display?.name ?? "Freelancer"}</span>
        <span className="text-2xl animate-bounce">👋</span>
      </h1>
      <p className="mt-2 text-sm text-app-muted flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-brand-500 shrink-0" />
        Your actual proposals, selected projects, and invoice records are summarized here.
      </p>

      {overdueCharges.length > 0 ? (
        <div className="mt-6 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm text-danger">
          <CircleAlert className="size-5 shrink-0" />
          <div>
            {COMMISSION_ENFORCEMENT_ENABLED ? (
              <>
                <p>You have unpaid platform commission. New project applications are blocked until it is paid.</p>
                {graceExpired ? <p className="mt-1">The {COMMISSION_GRACE_DAYS}-day grace period has passed — submitting new milestone work on existing projects is blocked as well.</p> : null}
              </>
            ) : (
              <p>You have unpaid platform commission. Please report payment on the commissions page.</p>
            )}
          </div>
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={stat.label} 
              href={stat.href} 
              className="relative overflow-hidden rounded-card border border-app-border bg-app-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-500/60 group"
            >
              {/* Top orange brand border point */}
              <div className="absolute top-0 left-0 h-[3px] w-full bg-brand-500" />

              {/* Styled Icon Box */}
              <div className="flex size-9 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-600">
                <Icon className="size-4.5" />
              </div>

              <p className="mt-4 text-xs font-bold text-app-muted uppercase tracking-wider">{stat.label}</p>
              <p className="mt-1.5 text-3xl font-black text-app-foreground tracking-tight">{stat.value}</p>
              
              {/* Badge-style detail label */}
              <div className="mt-2.5">
                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                  {stat.detail}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 rounded-card border border-app-border bg-app-surface p-6 shadow-card">
        <h2 className="font-black text-app-foreground">Next actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link 
            href="/opportunities" 
            className="group flex items-center justify-between rounded-control border border-app-border bg-app-surface p-4 text-sm font-bold text-app-foreground transition-all hover:border-brand-500/80 hover:bg-brand-50/10"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-600">
                <Search className="size-3.5" />
              </span>
              Find a project
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 duration-300" />
          </Link>
          <Link 
            href="/freelancer/projects" 
            className="group flex items-center justify-between rounded-control border border-app-border bg-app-surface p-4 text-sm font-bold text-app-foreground transition-all hover:border-brand-500/80 hover:bg-brand-50/10"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-600">
                <FolderKanban className="size-3.5" />
              </span>
              Continue selected work
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 duration-300" />
          </Link>
        </div>
      </section>
    </div>
  );
}
