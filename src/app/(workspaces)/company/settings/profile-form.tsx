"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateCompanyProfileAction } from "@/app/actions/profiles";
import type { CompanyProfileSettings } from "@/lib/backend";

export function CompanyProfileForm({ initialProfile }: { initialProfile: CompanyProfileSettings }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form action={(formData) => startTransition(async () => {
      const result = await updateCompanyProfileAction({ organizationName: String(formData.get("organizationName") ?? ""), contactName: String(formData.get("contactName") ?? ""), contactRole: String(formData.get("contactRole") ?? ""), teamSize: String(formData.get("teamSize") ?? ""), website: String(formData.get("website") ?? "") });
      setMessage(result.ok ? "기업 프로필을 저장했습니다." : result.error.message);
    })} className="mt-7 rounded-card border border-app-border bg-app-surface p-5 shadow-card sm:p-6">
      <h2 className="font-black text-app-foreground">기업 프로필</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="기업명" name="organizationName" value={initialProfile.organizationName} />
        <Field label="담당자 이름" name="contactName" value={initialProfile.contactName} />
        <Field label="담당자 역할" name="contactRole" value={initialProfile.contactRole} />
        <Field label="팀 규모" name="teamSize" value={initialProfile.teamSize} />
        <Field label="웹사이트" name="website" value={initialProfile.website} type="url" optional />
      </div>
      {message && <p className="mt-4 text-sm font-bold text-app-muted">{message}</p>}
      <button disabled={pending} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand-600 px-5 text-sm font-black text-white disabled:opacity-50">{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}저장</button>
    </form>
  );
}

function Field({ label, name, value, type = "text", optional = false }: { label: string; name: string; value: string; type?: string; optional?: boolean }) {
  return <label className="text-sm font-bold text-app-foreground">{label}<input name={name} type={type} required={!optional} defaultValue={value} className="mt-2 min-h-11 w-full rounded-control border border-app-border-strong px-3 text-sm font-normal" /></label>;
}
