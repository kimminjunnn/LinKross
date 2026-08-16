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

export type ProjectDraftFormData = Record<string, string>;

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
  lifecycleStage: string;
  createdAt: string;
}

export interface SowMilestoneInput {
  code: string;
  title: string;
  period: string;
  amount: string;
  dods: string[];
}

export interface SaveSowVersionInput {
  projectId: string;
  workDetail: string;
  startDate: string;
  endDate: string;
  budget: string;
  milestones: SowMilestoneInput[];
  englishSow?: unknown;
  printText?: string;
  pdfFileName?: string;
}

export interface SaveSowVersionOutput {
  sowVersionId: string;
  versionNumber: number;
  status: string;
}

export interface MilestoneChecklistItem {
  id: string;
  description: string;
  verificationMethod: string;
  isRequired: boolean;
}

export interface ProjectMilestoneSummary {
  id: string;
  code: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  status: string;
  position: number;
  checklist: MilestoneChecklistItem[];
}

export interface ApprovedSowMilestones {
  sowVersionId: string | null;
  versionNumber: number | null;
  milestones: ProjectMilestoneSummary[];
}

export interface SowWorkspaceContext {
  projectId: string;
  title: string;
  lifecycleStage: string;
  assigneeName: string | null;
}

export type SowStatus = "draft" | "in_review" | "revision_requested" | "approved" | "superseded";
export type UserRole = "company" | "freelancer";
export type CriterionKind = "acceptance" | "definition_of_done";
export type VerificationMethod = "automated_e2e" | "build" | "manual" | "document";

export interface SowApprovalRecord {
  role: UserRole;
  approverName: string | null;
  approvedAt: string;
}

export interface SowApprovalCriterion {
  id: string;
  kind: CriterionKind;
  description: string;
  verificationMethod: VerificationMethod;
  position: number;
}

export interface SowApprovalMilestone {
  id: string;
  code: string;
  title: string;
  period: string;
  amount: string;
  status: string;
  acceptanceCriteria: SowApprovalCriterion[];
  definitionOfDone: SowApprovalCriterion[];
  verificationMethods: VerificationMethod[];
}

export interface SowApprovalDocumentSection {
  title: string;
  body: string;
}

export interface SowApprovalDocument {
  projectId: string;
  version: string;
  requestedAt: string;
  pdfFileName: string;
  printText: string;
  documentSections: SowApprovalDocumentSection[];
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  summary: {
    coreScope: string;
    keyAcceptance: string;
    needsReview: string;
  };
}

export interface SowApprovalState {
  projectId: string;
  sowVersionId: string;
  version: string;
  status: SowStatus;
  contentHash: string;
  submittedForReviewAt: string | null;
  approvedAt: string | null;
  document: SowApprovalDocument;
  milestones: SowApprovalMilestone[];
  approvals: {
    company: SowApprovalRecord | null;
    freelancer: SowApprovalRecord | null;
  };
}

export interface ApproveSowInput {
  projectId: string;
  sowVersionId: string;
  contentHash: string;
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
