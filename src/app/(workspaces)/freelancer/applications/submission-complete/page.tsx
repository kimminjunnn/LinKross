import Link from "next/link";
import { CheckCircle2, FileText, Search } from "lucide-react";

export default function SubmissionCompletePage() {
  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center py-12">
      <section className="w-full rounded-card border border-app-border bg-app-surface p-7 text-center shadow-card sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500 text-white"><CheckCircle2 className="size-9" /></span>
        <p className="mt-6 text-xs font-semibold tracking-[0.12em] text-emerald-700 uppercase">Proposal submitted</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Your proposal is now part of the project record.</h1>
        <p className="mt-4 text-sm leading-6 text-app-muted">The immutable original is saved for the client to review. Track its actual status from My applications.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/freelancer/applications" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-semibold text-white"><FileText className="size-4" />View my applications</Link>
          <Link href="/opportunities" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong px-5 text-sm font-semibold"><Search className="size-4" />Find another project</Link>
        </div>
      </section>
    </div>
  );
}
