"use server";

import OpenAI from "openai";

import { assertActionRole } from "@/lib/auth/workspace-access";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type MilestoneInput = {
  id: string;
  code: string;
  title: string;
  period: string;
  amount: string;
  dods: string[];
};

export type AIAnalysisResult = {
  milestones: MilestoneInput[];
  extractedStartDate?: string | null;
  extractedEndDate?: string | null;
  extractedBudget?: string | null;
};

export async function analyzeWorkDetailWithLLM(
  workDetail: string,
  currentStartDate: string,
  currentEndDate: string
): Promise<AIAnalysisResult> {
  await assertActionRole("company");
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일에 키를 추가해주세요.");
  }

  const prompt = `
당신은 프로젝트 관리(PM) 및 외주 개발 계약 전문가입니다.
사용자가 작성한 한국어 '업무 상세 내용'을 분석하여 다음 사항을 추출하고 구성해 주세요.

1. 날짜 추출: 텍스트에서 시작일과 종료일이 보인다면 'YYYY.MM.DD' 형태로 추출하세요. 없으면 제공된 현재 날짜를 참고하거나 비워두세요.
2. 예산 추출: 텍스트에서 총 예산과 화폐 단위(예: 50,000 USDC, 100만원 등)를 찾아냅니다. 
3. 마일스톤 분할: 프로젝트의 복잡도와 기간을 고려하여 최적의 마일스톤 개수(최소 1개 ~ 최대 5개)를 결정하세요.
4. 마일스톤 세부 정보: 
   - 각 마일스톤의 기간(period)은 전체 프로젝트 기간 내에서 비율에 맞게 'YY.MM.DD - YY.MM.DD' 형태로 배분하세요.
   - 각 마일스톤의 할당 금액(amount)은 전체 예산을 중요도/비율에 맞게 나누어 '숫자 단위' 형식으로 배분하세요. (예: '20,000 USDC')
   - DoD(완료 조건): 각 마일스톤별로 명확하고 구체적인 완료 조건 문자열 배열을 작성하세요 (1~3개).

중요: 추출되는 모든 텍스트(마일스톤 제목, 완료 조건 등)는 반드시 **한국어**로 작성되어야 합니다.

현재 사용자가 폼에 입력해둔 날짜:
- 시작일: ${currentStartDate || "없음"}
- 종료일: ${currentEndDate || "없음"}

분석할 업무 상세 텍스트:
"""
${workDetail}
"""
`;

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert IT Project Manager and System Analyst." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sow_analysis",
          schema: {
            type: "object",
            properties: {
              extractedStartDate: { type: ["string", "null"], description: "YYYY.MM.DD format" },
              extractedEndDate: { type: ["string", "null"], description: "YYYY.MM.DD format" },
              extractedBudget: { type: ["string", "null"], description: "e.g., 50,000 USDC" },
              milestones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique ID (e.g. m-1, m-2)" },
                    code: { type: "string", description: "Milestone code (e.g. M1, M2)" },
                    title: { type: "string", description: "Milestone title" },
                    period: { type: "string", description: "Duration string (e.g. 24.10.01 - 24.10.31)" },
                    amount: { type: "string", description: "Budget allocation for this milestone" },
                    dods: {
                      type: "array",
                      items: { type: "string", description: "Definition of done checklist item" },
                    },
                  },
                  required: ["id", "code", "title", "period", "amount", "dods"],
                  additionalProperties: false,
                },
              },
            },
            required: ["extractedStartDate", "extractedEndDate", "extractedBudget", "milestones"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 0.2,
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      throw new Error("LLM Parsing failed");
    }

    return parsed as AIAnalysisResult;
  } catch (error: unknown) {
    console.error("LLM Analysis Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "LLM 연동 분석 중 오류가 발생했습니다.",
    );
  }
}
