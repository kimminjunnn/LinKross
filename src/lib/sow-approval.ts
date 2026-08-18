import type { EnglishSOWResult } from "@/lib/rag-translator";

export type ApprovalDocumentSection = {
  title: string;
  body: string;
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
  summary: {
    coreScope: string;
    keyAcceptance: string;
    needsReview: string;
  };
};

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
        title: "업무 명세서 원본",
        body: "업무명세서 탭에서 작성된 원본 내용을 확인합니다.",
      },
    ],
    acceptanceCriteria: sow.acceptanceCriteria ?? ["TBD"],
    definitionOfDone: sow.definitionOfDone ?? ["TBD"],
    summary: {
      coreScope: inScope.slice(0, 3).join(", ") || "SOW 원본 범위 확인 필요",
      keyAcceptance: `${sow.acceptanceCriteria?.length ?? 0}개 Acceptance Criteria와 ${
        sow.definitionOfDone?.length ?? 0
      }개 Definition of Done을 승인 기준으로 사용`,
      needsReview: "업무명세서 탭에서 작성된 원본 내용을 확인",
    },
  };
}
