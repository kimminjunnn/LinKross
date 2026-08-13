export type {
  BackendError,
  BackendErrorCode,
  BackendResult,
  BudgetType,
  CompanyProjectDetail,
  CompanyProjectSummary,
  CreateProjectInput,
  CreateProjectOutput,
  OpportunityDetail,
  OpportunitySummary,
  ProjectProposal,
  SelectProposalInput,
  SelectProposalOutput,
  SubmitProposalInput,
  SubmitProposalOutput,
} from "@/lib/backend/contracts";

export {
  createProject,
  getCompanyProjectDetail,
  getPublicOpportunity,
  listCompanyProjects,
  listPublicOpportunities,
} from "@/lib/backend/projects";
export { listProjectProposals, selectProposal, submitProposal } from "@/lib/backend/proposals";
