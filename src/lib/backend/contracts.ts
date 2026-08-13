export type BackendErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "RECRUITMENT_CLOSED"
  | "DUPLICATE_PROPOSAL"
  | "PROJECT_ALREADY_SELECTED"
  | "CONFLICT"
  | "DATABASE_ERROR";

export interface BackendError {
  code: BackendErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BackendError };

export type BudgetType = "fixed" | "range";

export interface CreateProjectInput {
  title: string;
  goal: string;
  requirements: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  currency?: string;
  projectType?: "web" | "mobile" | "saas" | "backend" | "other";
  technology?: string;
  deliverables?: string;
  outOfScope?: string;
  referenceNotes?: string;
  applicantGuidance?: string;
  budgetMaxAmount?: number;
  budgetType?: BudgetType;
}

export interface CreateProjectOutput {
  projectId: string;
}

export interface OpportunitySummary {
  id: string;
  title: string;
  organizationName: string;
  goal: string;
  projectType: string | null;
  technology: string | null;
  budgetAmount: number;
  budgetMaxAmount: number | null;
  budgetType: BudgetType;
  currency: string;
  startDate: string;
  endDate: string;
  recruitmentEndAt: string;
}

export interface CompanyProjectSummary {
  id: string;
  title: string;
  status: "recruiting" | "closed";
  lifecycleStage: string;
  budgetAmount: number;
  budgetMaxAmount: number | null;
  currency: string;
  recruitmentEndAt: string | null;
  proposalCount: number;
  createdAt: string;
}

export interface CompanyProjectDetail {
  id: string;
  title: string;
  projectType: string | null;
  technology: string | null;
  goal: string;
  requirements: string;
  deliverables: string | null;
  outOfScope: string | null;
  applicantGuidance: string | null;
  budgetAmount: number;
  budgetMaxAmount: number | null;
  budgetType: BudgetType;
  currency: string;
  startDate: string;
  endDate: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  status: "recruiting" | "closed";
  createdAt: string;
}

export interface OpportunityDetail extends OpportunitySummary {
  requirements: string;
  deliverables: string | null;
  outOfScope: string | null;
  applicantGuidance: string | null;
  recruitmentStartAt: string;
  currentRequirementVersionId: string;
  createdAt: string;
}

export interface SubmitProposalInput {
  projectId: string;
  content: string;
  optionalNotes?: string;
}

export interface SubmitProposalOutput {
  proposalId: string;
}

export interface ProjectProposal {
  id: string;
  projectId: string;
  freelancerId: string;
  requirementVersionId: string;
  content: string;
  optionalNotes: string | null;
  status: "submitted" | "withdrawn";
  submittedAt: string;
  withdrawnAt: string | null;
  freelancer: {
    displayName: string | null;
    headline: string | null;
    skills: string | null;
    portfolioUrls: string[];
  };
  isSelected: boolean;
}

export interface SelectProposalInput {
  projectId: string;
  proposalId: string;
}

export interface SelectProposalOutput {
  selectionId: string;
}
