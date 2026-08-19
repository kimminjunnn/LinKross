import type { VerificationMethod, VerificationRunStatus } from "@/lib/backend/contracts";
import type { ManagedTestSpec } from "@/lib/verification-test-spec";

export const ACTIVE_RUN_STATUSES = [
  "provisioning",
  "installing",
  "building",
  "running",
] as const satisfies readonly VerificationRunStatus[];

export const TERMINAL_RUN_STATUSES = [
  "passed",
  "failed",
  "needs_review",
  "timed_out",
  "cancelled",
] as const satisfies readonly VerificationRunStatus[];

export type ActiveVerificationRunStatus = (typeof ACTIVE_RUN_STATUSES)[number];
export type TerminalVerificationRunStatus = (typeof TERMINAL_RUN_STATUSES)[number];

export interface VerificationJobManifest {
  run: {
    id: string;
    attemptNumber: number;
    scope: "criterion" | "milestone";
    status: "provisioning";
    leaseExpiresAt: string;
  };
  project: { id: string };
  milestone: { id: string; code: string; title: string };
  submission: {
    id: string;
    attemptNumber: number;
    pullRequestNumber: number;
    pullRequestUrl: string;
    headBranch: string;
    commitSha: string;
  };
  repository: {
    id: string;
    provider: "github";
    owner: string;
    name: string;
    url: string;
    defaultBranch: string | null;
    isPrivate: boolean;
  };
  criteria: Array<{
    id: string;
    description: string;
    verificationMethod: VerificationMethod;
    testSpec: ManagedTestSpec | null;
    required: boolean;
    position: number;
  }>;
}

export interface VerificationJobLease {
  workerId: string;
  token: string;
}

export interface VerificationSourceBundle {
  archive: Uint8Array;
  sha256: string;
  commitSha: string;
}

export interface VerificationEvidenceInput {
  type: "screenshot" | "video" | "trace" | "log" | "preview" | "document";
  storagePath?: string;
  externalUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  isRedacted: boolean;
}

export interface VerificationCriterionResultInput {
  criterionId: string;
  status: "passed" | "failed" | "needs_review" | "not_run";
  observedResult?: string;
  errorMessage?: string;
  durationMs?: number;
  evidence: VerificationEvidenceInput[];
}

export interface CompleteVerificationRunInput {
  status: "passed" | "failed" | "needs_review";
  previewUrl?: string;
  errorSummary?: string;
  durationMs?: number;
  results: VerificationCriterionResultInput[];
}
