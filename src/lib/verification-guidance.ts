import "server-only";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ManualCheckGuidance {
  location: string;
  method: string;
  expected: string;
}

const MAX_GUIDANCE_BATCH = 20;

/**
 * 자동 검수 atom(UI/API) 중 어디에도 매칭되지 않은 DoD에 대해, 발주자가
 * Preview에서 직접 확인할 수 있도록 위치·방법·기대 결과를 생성한다.
 * 판정을 대신하지 않는다 — 항상 사람 확인이 필요한 상태에만 붙는 보조 정보다.
 * 실패하면 null 배열을 돌려주고 호출자는 안내 없이 진행한다(SOW 저장을 막지 않는다).
 */
export async function generateManualCheckGuidance(
  descriptions: string[],
): Promise<Array<ManualCheckGuidance | null>> {
  if (descriptions.length === 0) return [];
  if (!process.env.OPENAI_API_KEY) return descriptions.map(() => null);

  const bounded = descriptions.slice(0, MAX_GUIDANCE_BATCH);

  try {
    const completion = await openai.chat.completions.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "당신은 IT 지식이 없는 스타트업 대표에게 웹 서비스 확인 방법을 안내하는 도우미입니다. " +
            "개발자 없이도 화면을 보고 직접 확인할 수 있게 안내하세요. 코드, API, 기술 용어를 쓰지 마세요.",
        },
        {
          role: "user",
          content:
            "아래 완료 조건(DoD) 목록은 자동 검증 도구로 판정할 수 없어 사람이 직접 확인해야 합니다. " +
            "각 항목마다 어디를 봐야 하는지(location), 무엇을 눌러보거나 입력해야 하는지(method), " +
            "정상이면 무엇이 보여야 하는지(expected)를 한 문장씩, 비개발자가 이해할 수 있는 말로 작성하세요.\n\n" +
            bounded.map((d, i) => `${i + 1}. ${d}`).join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "manual_check_guidance",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    location: { type: "string", description: "확인해야 할 화면 또는 위치, 한 문장" },
                    method: { type: "string", description: "무엇을 클릭·입력해야 하는지, 한 문장" },
                    expected: { type: "string", description: "정상일 때 보여야 할 결과, 한 문장" },
                  },
                  required: ["location", "method", "expected"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 0.2,
    });

    const parsed = completion.choices[0].message.parsed as { items: ManualCheckGuidance[] } | null;
    if (!parsed || parsed.items.length !== bounded.length) {
      return descriptions.map(() => null);
    }

    const guidanceByIndex = new Map<number, ManualCheckGuidance>(
      parsed.items.map((item, index) => [index, item]),
    );
    return descriptions.map((_, index) => guidanceByIndex.get(index) ?? null);
  } catch (error) {
    console.error("[verification-guidance] LLM guidance generation failed", error);
    return descriptions.map(() => null);
  }
}
