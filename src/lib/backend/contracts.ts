export type BackendErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "RECRUITMENT_CLOSED"
  | "DUPLICATE_PROPOSAL"
  | "PROJECT_ALREADY_SELECTED"
  | "CONFLICT"
  | "COMPANY_PROFILE_REQUIRED"
  | "FREELANCER_PROFILE_REQUIRED"
  | "DATABASE_ERROR";

export interface BackendError {
  code: BackendErrorCode;
  message: string;
  diagnosticCode?: string;
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
  verificationDesigns?: DodVerificationDesign[];
}

export type VerificationDesignStatus =
  | "dod_ready"
  | "contract_ready"
  | "automation_ready"
  | "clarification_required"
  | "human_review_required";

export type DodTestScenario =
  | "navigation"
  | "form_submission"
  | "validation_error"
  | "state_change"
  | "state_persistence"
  | "duplicate_prevention"
  | "list_filter"
  | "empty_state"
  | "error_recovery"
  | "access_control"
  | "generic_ui";

export interface DodTestContract {
  version: 1;
  scenario: DodTestScenario;
  startPath?: string;
  precondition?: string;
  fixture?: string;
  action?: string;
  target?: string;
  input?: string;
  expected?: string;
  cleanup?: string;
}

export interface DodClarificationRequirement {
  key: string;
  question: string;
  suggestions?: string[];
  recommendedSuggestion?: string;
  answer?: string;
}

export interface DodVerificationDesign {
  startPath?: string;
  testHint?: string;
  question?: string;
  suggestions?: string[];
  recommendedSuggestion?: string;
  conversation?: DodVerificationConversationMessage[];
  requirements?: DodClarificationRequirement[];
  testContract?: DodTestContract;
  questionSetLocked?: boolean;
  humanReviewAccepted?: boolean;
  status?: VerificationDesignStatus;
  message?: string;
  verificationMethod?: VerificationMethod;
}

export interface DodVerificationConversationMessage {
  role: "assistant" | "user";
  content: string;
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
  verificationDesigns: Array<{
    milestoneCode: string;
    dodIndex: number;
    description: string;
    design: DodVerificationDesign;
  }>;
}

export interface MilestoneChecklistItem {
  id: string;
  description: string;
  verificationMethod: string;
  isRequired: boolean;
  manualGuidance?: {
    location: string;
    method: string;
    expected: string;
  };
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

export interface SowWorkspaceDraft {
  sowVersionId: string;
  versionNumber: number;
  status: SowStatus;
  workDetail: string;
  startDate: string;
  endDate: string;
  budget: string;
  milestones: SowMilestoneInput[];
  englishSow: unknown | null;
}

export interface SowWorkspaceContext {
  projectId: string;
  title: string;
  lifecycleStage: string;
  assigneeName: string | null;
  budgetAmount: number;
  budgetMaxAmount: number | null;
  currency: string;
  startDate: string;
  endDate: string;
  latestSowDraft: SowWorkspaceDraft | null;
  revisionRequests: SowRevisionRequestRecord[];
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

export interface SowApprovalParticipant {
  role: UserRole;
  roleLabel: string;
  displayName: string;
}

export interface SowRevisionRequestRecord {
  id: string;
  projectId: string;
  sowVersionId: string;
  requesterRole: UserRole;
  requesterName: string | null;
  reason: string;
  requestedAt: string;
  readAt: string | null;
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
  participants: {
    company: SowApprovalParticipant;
    freelancer: SowApprovalParticipant;
  };
  document: SowApprovalDocument;
  milestones: SowApprovalMilestone[];
  approvals: {
    company: SowApprovalRecord | null;
    freelancer: SowApprovalRecord | null;
  };
  revisionRequests: SowRevisionRequestRecord[];
}

export interface ApproveSowInput {
  projectId: string;
  sowVersionId: string;
  contentHash: string;
}

export interface RequestSowRevisionInput extends ApproveSowInput {
  reason: string;
}

export type WorkspaceNotificationKind =
  | "proposal_selected"
  | "sow_approval_requested"
  | "sow_revision_requested"
  | "sow_approved";

export interface WorkspaceNotification {
  id: string;
  kind: WorkspaceNotificationKind;
  title: string;
  description: string;
  projectTitle: string;
  occurredAt: string;
  href: string;
  requiresAction: boolean;
}

export interface MarkSowRevisionRequestsReadInput {
  projectId: string;
  sowVersionId: string;
}

export interface OpportunityDetail extends OpportunitySummary {
  requirements: string;
  deliverables: string | null;
  outOfScope: string | null;
  applicantGuidance: string | null;
  recruitmentStartAt: string;
  currentRequirementVersionId: string;
  createdAt: string;
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    downloadUrl: string;
  }>;
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

export type FreelancerApplicationStatus = "submitted" | "withdrawn" | "selected";

export interface FreelancerApplicationSummary {
  proposalId: string;
  projectId: string;
  title: string;
  organizationName: string;
  status: FreelancerApplicationStatus;
  content: string;
  optionalNotes: string | null;
  submittedAt: string;
  withdrawnAt: string | null;
  budgetAmount: number | null;
  budgetMaxAmount: number | null;
  currency: string | null;
  recruitmentEndAt: string | null;
}

export interface FreelancerProjectSummary {
  projectId: string;
  proposalId: string;
  title: string;
  organizationName: string;
  lifecycleStage: string;
  startDate: string | null;
  endDate: string | null;
  budgetAmount: number | null;
  budgetMaxAmount: number | null;
  currency: string | null;
  selectedAt: string;
  milestoneCount: number;
  approvedMilestoneCount: number;
}

export type VerificationRunStatus =
  | "queued"
  | "provisioning"
  | "installing"
  | "building"
  | "running"
  | "passed"
  | "failed"
  | "needs_review"
  | "timed_out"
  | "cancelled";

export interface ProjectRepositoryRecord {
  id: string;
  projectId: string;
  owner: string;
  name: string;
  url: string;
  defaultBranch: string | null;
  installationId: number | null;
  isPrivate: boolean;
  companyConfirmedAt: string | null;
}

export interface VerificationResultRecord {
  id: string;
  criterionId: string;
  status: "queued" | "running" | "passed" | "failed" | "needs_review" | "not_run";
  observedResult: string | null;
  errorMessage: string | null;
  evidence: Array<{
    id: string;
    type: string;
    url: string | null;
    storagePath: string | null;
  }>;
}

export interface VerificationRunRecord {
  id: string;
  scope: "criterion" | "milestone";
  requestedCriterionId: string | null;
  attemptNumber: number;
  status: VerificationRunStatus;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  previewUrl: string | null;
  errorSummary: string | null;
  results: VerificationResultRecord[];
}

export interface MilestoneSubmissionRecord {
  id: string;
  attemptNumber: number;
  pullRequestNumber: number;
  pullRequestTitle: string;
  pullRequestUrl: string;
  headBranch: string;
  headCommitSha: string;
  implementationNote: string | null;
  submittedAt: string;
  claimedCriterionIds: string[];
  runs: VerificationRunRecord[];
}

export interface VerificationMilestoneRecord extends ProjectMilestoneSummary {
  submissions: MilestoneSubmissionRecord[];
  decision: {
    submissionId: string;
    decision: "revision_required" | "approved";
    reason: string | null;
    decidedAt: string;
  } | null;
}

export interface VerificationWorkspace {
  projectId: string;
  isCompany: boolean;
  repository: ProjectRepositoryRecord | null;
  sowVersionId: string | null;
  sowVersionNumber: number | null;
  milestones: VerificationMilestoneRecord[];
}

export interface ConnectRepositoryInput {
  projectId: string;
  repositoryUrl: string;
}

export interface SubmitMilestonePullRequestInput {
  projectId: string;
  milestoneId: string;
  pullRequestUrl: string;
  claimedCriterionIds: string[];
  implementationNote?: string;
}

export interface MilestoneSubmissionReceipt {
  submissionId: string;
  headCommitSha: string;
  verificationRunId: string;
  verificationStatus: VerificationRunStatus;
}

export interface RequestVerificationInput {
  projectId: string;
  milestoneId: string;
  submissionId: string;
  scope: "criterion" | "milestone";
  criterionId?: string;
}

export interface DecideMilestoneInput {
  projectId: string;
  milestoneId: string;
  submissionId: string;
  verificationRunId?: string;
  decision: "revision_required" | "approved";
  reason?: string;
}

export type InvoiceStatus = "submitted" | "approved" | "rejected" | "cancelled";
export type PaymentRecordStatus = "requested" | "processing" | "completed" | "failed";
export type PaymentMethod = "wallet_testnet" | "bank_transfer" | "card" | "other";

export interface InvoiceRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  organizationName: string;
  milestoneId: string;
  milestoneCode: string;
  milestoneTitle: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  vatAmount: number;
  currency: string;
  externalReference: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface FinancialMilestoneRecord {
  id: string;
  code: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  approvedAt: string | null;
  invoice: InvoiceRecord | null;
  payment: {
    id: string;
    status: PaymentRecordStatus;
    method: PaymentMethod;
    amount: number;
    currency: string;
    externalReference: string | null;
    toAddress: string | null;
    blockNumber: number | null;
    requestedAt: string | null;
    processingAt: string | null;
    completedAt: string | null;
  } | null;
}

export interface ProjectFinancialWorkspace {
  projectId: string;
  projectTitle: string;
  lifecycleStage: string;
  freelancerWalletAddress: string | null;
  milestones: FinancialMilestoneRecord[];
  evidenceBundles: Array<{
    id: string;
    versionNumber: number;
    status: "generating" | "ready" | "failed";
    storagePath: string | null;
    sha256: string | null;
    requestedAt: string;
    completedAt: string | null;
    errorMessage: string | null;
  }>;
}

export interface SubmitInvoiceInput {
  projectId: string;
  milestoneId: string;
  invoiceNumber: string;
  externalReference?: string;
  vatAmount?: number;
}

export interface ReviewInvoiceInput {
  projectId: string;
  invoiceId: string;
  status: "approved" | "rejected";
  reviewNote?: string;
}

export interface RequestPaymentInput {
  projectId: string;
  milestoneId: string;
  method: PaymentMethod;
}

export interface AdvancePaymentStatusInput {
  projectId: string;
  paymentId: string;
  status: Exclude<PaymentRecordStatus, "requested">;
  externalReference?: string;
}

export interface VerifyWalletPaymentInput {
  projectId: string;
  paymentId: string;
  txHash: string;
}

export interface GenerateEvidenceBundleOutput {
  bundleId: string;
  versionNumber: number;
}

export interface EvidenceBundleDetail {
  id: string;
  versionNumber: number;
  status: "generating" | "ready" | "failed";
  sha256: string | null;
  requestedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  payload: Record<string, unknown> | null;
}

export interface CompanyProfileSettings {
  organizationName: string;
  contactName: string;
  contactRole: string;
  teamSize: string;
  website: string;
}

export interface FreelancerProfileSettings {
  displayName: string;
  timezone: string;
  headline: string;
  skills: string;
  portfolioUrls: string[];
  walletAddress: string | null;
}
