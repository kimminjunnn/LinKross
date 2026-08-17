import { CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { getFreelancerProfileSettings } from "@/lib/backend";
import { FreelancerProfileForm } from "./profile-form";

export default async function FreelancerSettingsPage() {
  const result = await getFreelancerProfileSettings();
  return (
    <div className="mx-auto w-full max-w-4xl pb-16">
      <PageHeader eyebrow="Account" title="Profile and settings" description="Manage the profile snapshot clients see with your future proposals." />
      {!result.ok ? <div className="mt-7 flex gap-3 rounded-card border border-danger/30 bg-danger/10 p-5 text-sm font-bold text-danger"><CircleAlert className="size-5 shrink-0" />{result.error.message}</div> : <FreelancerProfileForm initialProfile={result.data} />}
      <section className="mt-5 rounded-card border border-app-border bg-app-surface p-5 shadow-card"><h2 className="font-black text-app-foreground">GitHub and notifications</h2><p className="mt-2 text-sm leading-6 text-app-muted">Repository access is confirmed per selected project. Account-level GitHub OAuth and notification delivery need a GitHub App and messaging provider, so no disconnected controls are shown here.</p></section>
    </div>
  );
}
