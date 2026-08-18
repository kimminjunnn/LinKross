"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateFreelancerProfileAction } from "@/app/actions/profiles";
import type { FreelancerProfileSettings } from "@/lib/backend";

export function FreelancerProfileForm({ initialProfile }: { initialProfile: FreelancerProfileSettings }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form action={(formData) => startTransition(async () => {
      const result = await updateFreelancerProfileAction({ displayName: String(formData.get("displayName") ?? ""), timezone: String(formData.get("timezone") ?? ""), headline: String(formData.get("headline") ?? ""), skills: String(formData.get("skills") ?? ""), portfolioUrls: String(formData.get("portfolioUrls") ?? "").split("\n") });
      setMessage(result.ok ? "Profile saved." : result.error.message);
    })} className="mt-7 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <h2 className="font-black text-app-foreground">Public proposal profile</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Display name" name="displayName" value={initialProfile.displayName} />
        <Field label="Time zone" name="timezone" value={initialProfile.timezone} />
        <Field label="Headline" name="headline" value={initialProfile.headline} wide />
        <Field label="Skills" name="skills" value={initialProfile.skills} wide />
        <label className="text-sm font-bold text-app-foreground sm:col-span-2">Portfolio links (one per line)<textarea name="portfolioUrls" defaultValue={initialProfile.portfolioUrls.join("\n")} className="mt-2 min-h-28 w-full rounded-control border border-app-border-strong p-3 text-sm font-normal" /></label>
      </div>
      {message && <p className="mt-4 text-sm font-bold text-app-muted">{message}</p>}
      <button disabled={pending} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-600 px-5 text-sm font-black text-white disabled:opacity-50">{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save profile</button>
    </form>
  );
}

function Field({ label, name, value, wide = false }: { label: string; name: string; value: string; wide?: boolean }) {
  return <label className={`text-sm font-bold text-app-foreground ${wide ? "sm:col-span-2" : ""}`}>{label}<input name={name} required defaultValue={value} className="mt-2 min-h-11 w-full rounded-control border border-app-border-strong px-3 text-sm font-normal" /></label>;
}
