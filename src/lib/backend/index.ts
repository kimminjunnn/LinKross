export type {
  BackendError,
  BackendErrorCode,
  BackendResult,
  BudgetType,
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
  getPublicOpportunity,
  listCompanyProjects,
  listPublicOpportunities,
} from "@/lib/backend/projects";
export { listProjectProposals, selectProposal, submitProposal } from "@/lib/backend/proposals";
