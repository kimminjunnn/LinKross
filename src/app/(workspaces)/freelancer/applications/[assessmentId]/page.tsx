"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Save, ShieldCheck } from "lucide-react";

import { getOpportunityAction, submitProposalAction } from "@/app/actions/projects";

const STORAGE_PREFIX = "linkross:proposal:";

type LocalOpportunity = {
  id: string;
  title: string;
  organization: string;
  requirements: string;
};

export default function FreelancerApplicationEditorPage() {
  const params = useParams<{ assessmentId: string }>();
  const router = useRouter();
  
  const [opportunity, setOpportunity] = useState<LocalOpportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = params.assessmentId;

    async function loadData() {
      const result = await getOpportunityAction(id);
      if (result.ok) {
        setOpportunity({
          id: result.data.id,
          title: result.data.title,
          organization: result.data.organizationName,
          requirements: result.data.requirements,
        });
      } else {
        setOpportunity(null);
        setErrorMessage(result.error.message);
      }
      setIsLoading(false);
    }

    void loadData();
  }, [params.assessmentId]);

  useEffect(() => {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${params.assessmentId}`);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as {
        proposal?: string;
        supportNeeded?: string;
      };
      const frame = window.requestAnimationFrame(() => {
        setProposal(draft.proposal ?? "");
        setSupportNeeded(draft.supportNeeded ?? "");
      });
      return () => window.cancelAnimationFrame(frame);
    } catch {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${params.assessmentId}`);
    }
  }, [params.assessmentId]);

  function saveDraft() {
    if (!opportunity) return;
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${params.assessmentId}`,
      JSON.stringify({ proposal, supportNeeded, status: "draft" }),
    );
    setSavedMessage("Draft saved on this device.");
  }

  async function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!opportunity) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await submitProposalAction(opportunity.id, proposal, supportNeeded);
    if (!result.ok) {
      setErrorMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    window.localStorage.removeItem(`${STORAGE_PREFIX}${params.assessmentId}`);
    window.localStorage.setItem(
      "linkross:last-submitted-opportunity",
      opportunity.id,
    );
    router.push("/freelancer/applications/submission-complete");
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl text-center py-20">
        <div className="animate-spin size-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-400 mt-4 text-xs font-semibold">Loading opportunity details...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-card border border-app-border bg-app-surface p-8 text-center shadow-card">
        <h1 className="text-2xl font-black">This opportunity is not available.</h1>
        <Link
          href="/opportunities"
          className="mt-5 inline-flex items-center gap-2 font-bold text-brand-700"
        >
          <ArrowLeft className="size-4" />
          Browse open opportunities
        </Link>
      </div>
    );
  }

  const currentOpportunity = opportunity;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href={`/opportunities/${currentOpportunity.id}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-brand-700"
      >
        <ArrowLeft className="size-4" />
        Review project details
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_19rem]">
        <form
          onSubmit={submitProposal}
          className="rounded-card border border-app-border bg-app-surface p-6 shadow-card sm:p-8"
        >
          <p className="text-xs font-black tracking-[0.12em] text-brand-700 uppercase">
            Free-form proposal
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {currentOpportunity.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-app-muted">
            Explain how you understand the project and how you plan to deliver it. The
            writing guide is optional and does not affect an automated score.
          </p>

          <label className="mt-8 block text-sm font-black">
            Your proposal
            <textarea
              required
              value={proposal}
              onChange={(event) => setProposal(event.target.value)}
              rows={16}
              placeholder="Describe your understanding of the project, implementation approach, technology choices, work stages, expected timeline, and delivery plan."
              className="mt-2 w-full rounded-control border border-app-border-strong bg-app-surface p-4 text-sm leading-6 outline-none transition-colors placeholder:text-app-muted/65 focus:border-brand-500"
            />
          </label>

          <label className="mt-6 block text-sm font-black">
            Risks, questions, or support you may need
            <span className="ml-2 font-medium text-app-muted">Optional</span>
            <textarea
              value={supportNeeded}
              onChange={(event) => setSupportNeeded(event.target.value)}
              rows={5}
              placeholder="Add any risks, mitigation ideas, dependencies, or support you would like from the client."
              className="mt-2 w-full rounded-control border border-app-border-strong bg-app-surface p-4 text-sm leading-6 outline-none transition-colors placeholder:text-app-muted/65 focus:border-brand-500"
            />
          </label>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-700 rounded-xl flex items-center gap-2">
              <span className="shrink-0 size-1.5 rounded-full bg-red-500 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-app-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center gap-2 rounded-control border border-app-border-strong px-4 text-sm font-bold hover:bg-app-surface-subtle disabled:opacity-50"
              >
                <Save className="size-4" />
                Save draft
              </button>
              {savedMessage ? (
                <p className="mt-2 text-xs text-accent-700">{savedMessage}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit proposal"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>

        <aside className="h-fit rounded-card border border-app-border bg-app-surface p-5 shadow-card lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-sm font-black">
            <ShieldCheck className="size-4 text-accent-600" />
            Optional writing guide
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-app-muted">
            <li>• Your understanding of the project goal</li>
            <li>• Your implementation approach and technology choices</li>
            <li>• Work stages and expected timeline</li>
            <li>• Deliverables and definition of completion</li>
            <li>• Risks and support you may need</li>
          </ul>
          <p className="mt-5 border-t border-app-border pt-4 text-xs leading-5 text-app-muted">
            LinKross keeps the submitted version as an immutable record. A later edit
            creates a new version instead of silently replacing the original.
          </p>
        </aside>
      </div>
    </div>
  );
}
