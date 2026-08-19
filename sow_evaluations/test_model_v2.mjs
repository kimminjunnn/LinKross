import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const currentStartDate = '26.09.01';
const currentEndDate = '26.12.31';

async function analyzeWorkDetailWithLLM(workDetail) {
  const prompt = `
당신은 매우 엄격한 QA 엔지니어이자 외주 개발 계약(SOW) 전문가입니다.
사용자가 작성한 한국어 '업무 상세 내용'을 분석하여 다음 사항을 추출하고 구성하되, 아래의 [필수 규칙]을 반드시 엄수하십시오.

[필수 규칙 - 절대 누락 금지]
1. 화면 단위 분할 (기술 용어 금지): 마일스톤을 "DB 설계", "API 개발" 등 개발 프로세스나 기술 레이어로 잡지 말고, 비개발 발주자가 브라우저에서 직접 확인할 수 있는 '사용자 화면 및 행동(Feature) 단위'로 나누세요.
2. 7단계 마이크로 세분화: 기능을 뭉뚱그리지 말고 최소 5~7개의 마일스톤으로 세분화하세요. 핵심 흐름, 제한/마감 처리, 예외 상황을 각각 별도 마일스톤으로 분리하세요.
3. 조건별 독립적 분리 (엣지 케이스 고립): 여러 조건을 절대 한 문장에 묶지 마세요. 
   - [나쁜 예] "이름과 증상 필드가 비어있을 경우 제출 버튼 비활성화"
   - [좋은 예] DoD 1: "이름 필드 누락 시 제출 버튼 비활성화 상태 유지됨", DoD 2: "증상 필드 누락 시 제출 버튼 비활성화 상태 유지됨"
   처럼 사소한 제약조건도 무조건 개별 DoD로 쪼개세요.
4. 정확한 URL 라우팅 명시: 사용자 행동 위치나 이동 목적지를 "마이페이지" 같은 추상적 명사가 아닌 \`/login\`, \`/admin/classes\` 등 정확한 URL(경로)로 반드시 표기하세요.
5. 관찰 가능한 상태 변화 묘사 및 명사형 종결: 모든 문장의 끝은 반드시 '~됨', '~함', '확인' 등 명사형으로 끝내세요. ('~한다', '~된다' 서술형 종결 절대 금지). 또한 "버튼 텍스트가 마감으로 변경됨", "에러 문구가 노출됨" 등 눈에 보이는 UI 컴포넌트의 상태 변화를 명확히 서술하세요.
6. 예산의 차등 분배 (기계적 균등 분배 금지): 마일스톤 예산을 단순 N분의 1로 나누지 마십시오. 난이도 높은 마일스톤에 가중치를 더 부여하세요.
7. 마무리 범위 보존: 원문에 없는 작업(QA, 배포 등)이나 비용은 임의로 추가하지 마세요.

[추출 항목]
1. 마일스톤 분할 및 세부 정보: (최소 5개 ~ 최대 7개)
   - period: 전체 기간(${currentStartDate} ~ ${currentEndDate}) 내에서 비율에 맞게 'YY.MM.DD - YY.MM.DD' 배분
   - amount: 전체 예산을 난이도에 맞게 차등 배분 (숫자 단위)
   - dods: 위 규칙에 따른 Playwright E2E 테스트 시나리오(액션+검증) 형태의 완료 조건 배열 (각 마일스톤 당 최소 1개 이상 필수이며, 최대 개수 제한은 없으므로 구체적인 검증이 필요하다면 최대한 상세하게 분리해서 작성하세요. 단일 문장에 여러 조건을 섞지 마세요)

중요: 추출되는 모든 텍스트는 반드시 **한국어**로 작성되어야 합니다.

분석할 업무 상세 텍스트:
"""
${workDetail}
"""
`;

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
                    items: { type: "string", description: "Playwright E2E testable Definition of Done checklist item" },
                  },
                },
                required: ["id", "code", "title", "period", "amount", "dods"],
                additionalProperties: false,
              },
            },
          },
          required: ["milestones"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
    temperature: 0.2,
  });

  return completion.choices[0].message.parsed;
}

async function main() {
  console.log("Starting v2.1 test with user examples...");
  const dataPath = path.join(__dirname, 'USER_5_EXAMPLES.txt');
  const rawText = fs.readFileSync(dataPath, 'utf-8');
  
  // Split by '## ' and filter out empty strings
  const scenariosRaw = rawText.split(/^## /m).map(s => s.trim()).filter(s => s.length > 0);
  const scenarios = scenariosRaw.slice(0, 5); // Take the first 5 examples
  
  let allResults = [];
  let mdOutput = "# 5 Examples V2.1 Test Results\\n\\n";

  let totalMilestones = 0;
  let endingViolations = 0; // sentences ending in 한다, 된다
  let combinedConditions = 0; // naive check: presence of '과', '와' coupled with '비어있을 경우' etc.

  for (let i = 0; i < scenarios.length; i++) {
    const text = scenarios[i];
    const scenarioTitle = text.split('\\n')[0];
    console.log(`Processing Scenario ${i+1}: ${scenarioTitle}`);
    
    try {
      const result = await analyzeWorkDetailWithLLM(text);
      totalMilestones += result.milestones.length;

      mdOutput += `## Scenario ${i+1}: ${scenarioTitle}\\n`;
      
      result.milestones.forEach(m => {
        mdOutput += `### ${m.code}: ${m.title}\\n`;
        m.dods.forEach(dod => {
          mdOutput += `- ${dod}\\n`;
          if (dod.endsWith('한다') || dod.endsWith('된다') || dod.endsWith('한다.') || dod.endsWith('된다.')) {
             endingViolations++;
          }
          if (dod.includes('비어있을 경우') && (dod.includes('과 ') || dod.includes('와 '))) {
             combinedConditions++;
          }
        });
      });
      mdOutput += "\\n---\\n";
    } catch (e) {
      console.error(`Error processing scenario ${i+1}:`, e);
    }
  }

  fs.writeFileSync(path.join(__dirname, 'EXP_Result_v2.md'), mdOutput);
  console.log("Results saved to EXP_Result_v2.md");
  
  console.log(`Total Milestones Generated: ${totalMilestones}`);
  console.log(`Ending Violations (~한다/된다): ${endingViolations}`);
  console.log(`Combined Conditions (naive guess): ${combinedConditions}`);
}

main();
