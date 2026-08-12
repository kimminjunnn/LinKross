"use client";

import Link from "next/link";
import { CheckCircle2, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { getOpportunity } from "@/data/opportunities";

export default function SubmissionCompletePage() {
  const [opportunityTitle, setOpportunityTitle] = useState("Your project proposal");

  useEffect(() => {
    const opportunityId = window.localStorage.getItem(
      "linkross:last-submitted-opportunity",
    );
    if (!opportunityId) return;
    const submittedOpportunity = getOpportunity(opportunityId);
    if (submittedOpportunity) {
      const frame = window.requestAnimationFrame(() => {
        setOpportunityTitle(submittedOpportunity.title);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center py-12">
      <section className="w-full rounded-card border border-app-border bg-app-surface p-7 text-center shadow-card sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="size-9" />
        </span>
        <p className="mt-6 text-xs font-black tracking-[0.12em] text-emerald-700 uppercase">
          Proposal submitted
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Your proposal is now part of the project record.
        </h1>
        <p className="mt-4 text-sm leading-6 text-app-muted">
          {opportunityTitle} was submitted successfully. You can review the saved
          version while the client considers the original proposal.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/freelancer/applications"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600"
          >
            <FileText className="size-4" />
            View my applications
          </Link>
          <Link
            href="/opportunities"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong px-5 text-sm font-bold hover:bg-app-surface-subtle"
          >
            <Search className="size-4" />
            Find another project
          </Link>
        </div>
      </section>
    </div>
  );
}
