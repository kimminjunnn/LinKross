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
      <h1 className="text-3xl font-black tracking-tight text-app-foreground">
        Welcome back, {display?.name ?? "Freelancer"}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
        Review your proposals, selected projects, invoices, and outstanding commission.
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

      <section className="mt-8 grid gap-px border-y border-app-border bg-app-border md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={stat.label} 
              href={stat.href} 
              className="bg-app-canvas px-1 py-6 transition-colors duration-150 hover:bg-app-surface-subtle md:px-5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-app-muted">
                <Icon className="size-4 text-brand-600" />
                <span>{stat.label}</span>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-app-foreground">{stat.value}</p>
              <p className="mt-1 text-xs leading-5 text-app-muted">{stat.detail}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black tracking-tight text-app-foreground">Next actions</h2>
        <div className="mt-4 divide-y divide-app-border border-y border-app-border">
          <Link 
            href="/opportunities" 
            className="flex items-center justify-between px-1 py-4 text-sm font-bold text-app-foreground transition-colors duration-150 hover:bg-app-surface-subtle"
          >
            <span className="inline-flex items-center gap-2.5">
              <Search className="size-4 text-brand-600" />
              Find a project
            </span>
            <ArrowRight className="size-4 text-app-muted" />
          </Link>
          <Link 
            href="/freelancer/projects" 
            className="flex items-center justify-between px-1 py-4 text-sm font-bold text-app-foreground transition-colors duration-150 hover:bg-app-surface-subtle"
          >
            <span className="inline-flex items-center gap-2.5">
              <FolderKanban className="size-4 text-brand-600" />
              Continue selected work
            </span>
            <ArrowRight className="size-4 text-app-muted" />
          </Link>
        </div>
      </section>
    </div>
  );
}
