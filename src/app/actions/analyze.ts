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
당신은 매우 엄격한 QA 엔지니어이자 외주 개발 계약(SOW) 전문가입니다.
사용자가 작성한 한국어 '업무 상세 내용'을 분석하여 다음 사항을 추출하고 구성하되, 아래의 [필수 규칙]을 반드시 엄수하십시오.

[필수 규칙 - 절대 누락 금지]
1. 세부 제약 조건 보존: 원문 텍스트에 기재된 사소한 제약조건(예: '회원가입 없음', '하루 전 취소', '특정 정보 입력 필수'), 제외 대상 등을 절대 임의로 요약하거나 생략하지 마세요. 모든 디테일은 해당 마일스톤의 DoD에 반드시 반영되어야 합니다.
2. 예산의 차등 분배 (기계적 균등 분배 금지): 마일스톤 예산을 단순 N분의 1로 나누지 마십시오. 백엔드 연동, 보안, 복잡한 트랜잭션이 포함된 난이도 높은 마일스톤에 예산 가중치를 더 부여하고, 단순 화면이나 QA는 상대적으로 낮게 배분하세요.
3. 필수 마일스톤 추가: 마지막 마일스톤은 반드시 '통합 테스트(QA), 배포, 소스코드 및 매뉴얼 인수인계' 항목을 다루는 마무리를 위한 마일스톤으로 생성하고, 전체 예산의 약 10~15%를 할당하세요.
4. 객관적이고 테스트 가능한 DoD (완료 기준): DoD는 "예약 기능 구현", "조회 가능" 같은 모호한 표현을 절대 쓰지 마세요. 
   - [나쁜 예] 고객이 예약 페이지에서 수업 예약 가능
   - [좋은 예] 고객이 회원가입 없이 지점, 날짜, 가능 시간을 선택하고 이메일을 입력하면 예약 번호가 생성되며 예약 완료 화면이 표시된다. 중복 예약은 차단된다.

[추출 항목]
1. 날짜 추출: 'YYYY.MM.DD' 형태로 추출 (없으면 제공된 현재 날짜 참고)
2. 예산 추출: 총 예산과 화폐 단위(예: 50,000 USDC) 추출
3. 마일스톤 분할 및 세부 정보: (최소 2개 ~ 최대 5개)
   - period: 전체 기간 내에서 비율에 맞게 'YY.MM.DD - YY.MM.DD' 배분
   - amount: 전체 예산을 난이도에 맞게 차등 배분 (숫자 단위)
   - dods: 위 규칙에 따른 구체적이고 객관적인 E2E 테스트 시나리오 형태의 완료 조건 배열

중요: 추출되는 모든 텍스트는 반드시 **한국어**로 작성되어야 합니다.

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
