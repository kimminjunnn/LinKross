import Link from "next/link";
import { ArrowRight, CircleAlert, FileText, FolderKanban, Search, Send } from "lucide-react";

import { listFreelancerApplications, listFreelancerInvoices, listFreelancerProjects } from "@/lib/backend";
import { getCurrentUserDisplay } from "@/lib/profile-display";

export default async function FreelancerHomePage() {
  const [applications, projects, invoices, display] = await Promise.all([
    listFreelancerApplications(),
    listFreelancerProjects(),
    listFreelancerInvoices(),
    getCurrentUserDisplay("freelancer"),
  ]);
  const error = !applications.ok ? applications.error : !projects.ok ? projects.error : !invoices.ok ? invoices.error : null;

  if (error) return <div className="flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm text-danger"><CircleAlert className="size-5 shrink-0" />{error.message}</div>;
  if (!applications.ok || !projects.ok || !invoices.ok) return null;

  const pendingApplications = applications.data.filter((item) => item.status === "submitted").length;
  const pendingInvoices = invoices.data.filter((item) => item.status === "submitted").length;
  const stats = [
    { label: "Proposals submitted", value: applications.data.length, detail: `${pendingApplications} under review`, icon: Send, href: "/freelancer/applications" },
    { label: "Selected projects", value: projects.data.length, detail: `${projects.data.reduce((sum, project) => sum + project.milestoneCount, 0)} milestones`, icon: FolderKanban, href: "/freelancer/projects" },
    { label: "Invoices submitted", value: invoices.data.length, detail: `${pendingInvoices} awaiting review`, icon: FileText, href: "/freelancer/invoices" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <p className="text-xs font-semibold tracking-[0.12em] text-brand-700 uppercase">Freelancer workspace</p>
      <h1 className="mt-2 text-3xl font-bold text-app-foreground">Welcome back, {display?.name ?? "Freelancer"}</h1>
      <p className="mt-2 text-sm text-app-muted">Your actual proposals, selected projects, and invoice records are summarized here.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="rounded-card border border-app-border bg-app-surface p-5 shadow-card transition hover:border-brand-300">
              <Icon className="size-5 text-brand-600" />
              <p className="mt-4 text-xs text-app-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-app-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-app-muted">{stat.detail}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 rounded-card border border-app-border bg-app-surface p-6 shadow-card">
        <h2 className="font-semibold text-app-foreground">Next actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/opportunities" className="flex items-center justify-between rounded-control border border-app-border p-4 text-sm font-semibold text-app-foreground hover:bg-app-surface-subtle"><span className="inline-flex items-center gap-2"><Search className="size-4 text-brand-600" />Find a project</span><ArrowRight className="size-4" /></Link>
          <Link href="/freelancer/projects" className="flex items-center justify-between rounded-control border border-app-border p-4 text-sm font-semibold text-app-foreground hover:bg-app-surface-subtle"><span className="inline-flex items-center gap-2"><FolderKanban className="size-4 text-brand-600" />Continue selected work</span><ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </div>
  );
}
