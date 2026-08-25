import Link from "next/link";
import { CheckCircle2, FileText, Search } from "lucide-react";

export default function SubmissionCompletePage() {
  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center py-12">
      <section className="w-full rounded-card border border-app-border bg-app-surface p-7 text-center shadow-card sm:p-10">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-success" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Proposal submitted</h1>
        <p className="mt-4 text-sm leading-6 text-app-muted">The immutable original is saved for the client to review. Track its actual status from My applications.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/freelancer/applications" className="primary-action inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold"><FileText className="size-4" />View my applications</Link>
          <Link href="/opportunities" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-app-border-strong px-5 text-sm font-semibold"><Search className="size-4" />Find another project</Link>
        </div>
      </section>
    </div>
  );
}
