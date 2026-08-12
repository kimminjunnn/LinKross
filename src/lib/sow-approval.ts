import type { EnglishSOWResult } from "@/lib/rag-translator";

export type ApprovalDocumentSection = {
  title: string;
  body: string;
};

export type ApprovalCriteriaSummary = {
  scope: string;
  outOfScope: string;
  completionCriteria: string;
  responsibilities: string;
};

export type ApprovalSowSnapshot = {
  projectId: string;
  version: string;
  requestedAt: string;
  pdfFileName: string;
  printText: string;
  documentSections: ApprovalDocumentSection[];
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  approvalCriteriaSummary?: ApprovalCriteriaSummary;
  summary: {
    coreScope: string;
    keyAcceptance: string;
    needsReview: string;
  };
};

const STORAGE_PREFIX = "linkross_sow_approval_snapshot:";
const snapshotCache = new Map<
  string,
  {
    raw: string | null;
    value: ApprovalSowSnapshot | null;
  }
>();

export function getApprovalSowStorageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function formatSowVersion(version: string) {
  return version.startsWith("v") ? version : `v${version}`;
}

export function createApprovalSowSnapshot({
  projectId,
  sow,
  printText,
}: {
  projectId: string;
  sow: EnglishSOWResult;
  printText: string;
}): ApprovalSowSnapshot {
  const version = formatSowVersion(sow.version);
  const pdfFileName = `LinKross_${projectId}_SOW_${version}.pdf`;
  const milestones = sow.timelineAndMilestones ?? [];
  const inScope = sow.scopeOfWork?.inScope ?? [];
  const outOfScope = sow.scopeOfWork?.outOfScope ?? [];

  return {
    projectId,
    version,
    requestedAt: new Date().toISOString(),
    pdfFileName,
    printText,
    documentSections: [
      {
        title: "Project Overview & Objectives",
        body: [
          `Background: ${sow.overview?.background ?? "TBD"}`,
          `Objective: ${sow.overview?.objective ?? "TBD"}`,
        ].join("\n"),
      },
      {
        title: "Scope of Work",
        body: [
          "In-Scope:",
          ...(inScope.length ? inScope.map((item) => `- ${item}`) : ["- TBD"]),
          "",
          "Out-of-Scope:",
          ...(outOfScope.length ? outOfScope.map((item) => `- ${item}`) : ["- TBD"]),
        ].join("\n"),
      },
      {
        title: "Milestones",
        body: milestones.length
          ? milestones
              .map((milestone) =>
                [
                  `${milestone.code}. ${milestone.titleEn}`,
                  `Period: ${milestone.period}`,
                  `Amount: ${milestone.amount}`,
                  "DoD:",
                  ...(milestone.dodsEn ?? []).map((item) => `- ${item}`),
                ].join("\n"),
              )
              .join("\n\n")
          : "TBD",
      },
      {
        title: "Roles & Responsibilities",
        body: [
          `Client: ${sow.rolesAndResponsibilities?.client ?? "TBD"}`,
          `Vendor: ${sow.rolesAndResponsibilities?.vendor ?? "TBD"}`,
        ].join("\n"),
      },
      {
        title: "PDF 인쇄 원본",
        body: `${pdfFileName} 파일명으로 PDF 저장을 요청한 승인 기준 문서입니다.`,
      },
    ],
    acceptanceCriteria: sow.acceptanceCriteria ?? ["TBD"],
    definitionOfDone: sow.definitionOfDone ?? ["TBD"],
    approvalCriteriaSummary: {
      scope: inScope.slice(0, 3).join("; ") || "Scope will be confirmed from the approved SOW.",
      outOfScope:
        outOfScope.slice(0, 3).join("; ") || "No explicit out-of-scope items were provided in this version.",
      completionCriteria: `${sow.acceptanceCriteria?.length ?? 0} Acceptance Criteria and ${
        sow.definitionOfDone?.length ?? 0
      } Definition of Done items will be used as approval and verification criteria.`,
      responsibilities: [
        `Client: ${sow.rolesAndResponsibilities?.client ?? "TBD"}`,
        `Vendor: ${sow.rolesAndResponsibilities?.vendor ?? "TBD"}`,
      ].join(" / "),
    },
    summary: {
      coreScope: inScope.slice(0, 3).join(", ") || "SOW 원본 범위 확인 필요",
      keyAcceptance: `${sow.acceptanceCriteria?.length ?? 0}개 Acceptance Criteria와 ${
        sow.definitionOfDone?.length ?? 0
      }개 Definition of Done을 승인 기준으로 사용`,
      needsReview: `${version} PDF 인쇄 원본과 승인 탭의 상세 문서가 같은 내용인지 확인`,
    },
  };
}

export function saveApprovalSowSnapshot(projectId: string, snapshot: ApprovalSowSnapshot) {
  if (typeof window === "undefined") return;

  const storageKey = getApprovalSowStorageKey(projectId);
  const raw = JSON.stringify(snapshot);

  snapshotCache.set(storageKey, { raw, value: snapshot });
  window.localStorage.setItem(storageKey, raw);
}

export function readApprovalSowSnapshot(projectId: string) {
  if (typeof window === "undefined") return null;

  const storageKey = getApprovalSowStorageKey(projectId);
  const raw = window.localStorage.getItem(storageKey);
  const cached = snapshotCache.get(storageKey);

  if (cached?.raw === raw) {
    return cached.value;
  }

  try {
    const value = raw ? (JSON.parse(raw) as ApprovalSowSnapshot) : null;
    snapshotCache.set(storageKey, { raw, value });
    return value;
  } catch (error) {
    console.error("Failed to read approval SOW snapshot:", error);
    snapshotCache.set(storageKey, { raw, value: null });
    return null;
  }
}
