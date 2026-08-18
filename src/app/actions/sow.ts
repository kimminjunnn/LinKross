"use server";

import OpenAI from "openai";
import type {
  ApproveSowInput,
  BackendResult,
  SaveSowVersionInput,
  SaveSowVersionOutput,
  SowApprovalState,
  RequestSowRevisionInput,
} from "@/lib/backend";
import {
  approveSowAsCompany,
  approveSowAsFreelancer,
  getSowApprovalState,
  saveSowDraft,
  requestSowRevision,
  submitSowForReview,
} from "@/lib/backend";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SowSummaryResult = {
  coreScope: string;
  keyAcceptance: string;
  needsReview: string;
};

export async function saveSowDraftAction(
  input: SaveSowVersionInput,
): Promise<BackendResult<SaveSowVersionOutput>> {
  return saveSowDraft(input);
}

export async function submitSowForReviewAction(
  input: SaveSowVersionInput,
): Promise<BackendResult<SaveSowVersionOutput>> {
  return submitSowForReview(input);
}

export async function getSowApprovalStateAction(
  projectId: string,
): Promise<BackendResult<SowApprovalState | null>> {
  return getSowApprovalState(projectId);
}

export async function approveSowAsCompanyAction(
  input: ApproveSowInput,
): Promise<BackendResult<SowApprovalState>> {
  return approveSowAsCompany(input);
}

export async function approveSowAsFreelancerAction(
  input: ApproveSowInput,
): Promise<BackendResult<SowApprovalState>> {
  return approveSowAsFreelancer(input);
}

export async function requestSowRevisionAction(
  input: RequestSowRevisionInput,
): Promise<BackendResult<SowApprovalState>> {
  return requestSowRevision(input);
}

export async function generateSowSummaryAction(
  workDetailKo: string,
  englishSowBackground?: string,
  englishSowObjective?: string,
  acceptanceCriteria: string[] = [],
  definitionOfDone: string[] = []
): Promise<BackendResult<SowSummaryResult>> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일에 키를 추가해주세요." }
    };
  }

  const prompt = `
당신은 프로젝트 관리(PM) 및 시스템 분석 전문가입니다.
제공된 업무명세서(SOW) 정보를 기반으로 발주자(PO)가 검토해야 할 핵심 사항들을 한국어로 1문장씩 요약해 주세요.

업무명세서(SOW) 정보:
- 한국어 업무 상세: ${workDetailKo || "없음"}
- 영어 배경/목적: Background: ${englishSowBackground || "없음"}, Objective: ${englishSowObjective || "없음"}
- 완료 조건(Acceptance Criteria): ${acceptanceCriteria.join(", ") || "없음"}
- 완료 정의(Definition of Done): ${definitionOfDone.join(", ") || "없음"}

출력은 반드시 다음 JSON 스키마를 준수하여 한국어로 작성해 주세요:
{
  "coreScope": "이 프로젝트의 핵심 개발 범위 및 목적 요약 (한국어 1문장, 예: '로드사이클 라이더의 FTP 측정 및 분석 알고리즘, 대시보드 구축')",
  "keyAcceptance": "가장 중요한 검수 기준 또는 핵심 완료 조건 요약 (한국어 1문장, 예: '이메일 로그인 기능 및 FTP 20분 테스트 결과를 통한 자동 계산 E2E 검수 통과')",
  "needsReview": "발주자가 특히 눈여겨보고 직접 확인해야 하는 부분 또는 주의점 요약 (한국어 1문장, 예: '로그인 시 /dashboard 이동 및 오류 메시지 예외 처리 동작 여부 확인')"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert IT Project Manager and System Analyst." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsed = JSON.parse(content) as SowSummaryResult;
    return { ok: true, data: parsed };
  } catch (error: any) {
    console.error("AI SOW Summary Generation Error:", error);
    return {
      ok: false,
      error: { code: "DATABASE_ERROR", message: error.message || "AI 요약 생성 중 오류가 발생했습니다." }
    };
  }
}
