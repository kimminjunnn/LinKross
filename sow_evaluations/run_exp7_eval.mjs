import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

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
2. 마이크로 세분화: 기능을 뭉뚱그리지 말고 최소 5~10개의 마일스톤으로 세분화하세요. 핵심 흐름, 제한/마감 처리, 예외 상황을 각각 별도 마일스톤으로 분리하세요.
3. 조건별 독립적 분리 (엣지 케이스 및 복수 상태 전이 고립): 여러 조건이나 다단계 상태 전이를 절대 한 문장에 묶지 마세요.
   - [나쁜 예 1] "이름과 증상 필드가 비어있을 경우 제출 버튼 비활성화"
   - [좋은 예 1] DoD 1: "이름 필드 누락 시 제출 버튼 비활성화 상태 유지 확인", DoD 2: "증상 필드 누락 시 제출 버튼 비활성화 상태 유지 확인"
   - [나쁜 예 2] "주문 상태를 세탁 중, 세탁 완료, 배송 완료로 순차 변경 확인"
   - [좋은 예 2] DoD 1: "\`/admin/orders/:id\`에서 '세탁 중' 처리 시 주문 상태가 '세탁 중'으로 변경 확인", DoD 2: "\`/admin/orders/:id\`에서 '세탁 완료' 처리 시 주문 상태가 '배송 대기'로 전환 확인"
4. 정확한 URL 라우팅 명시: 모든 DoD는 반드시 행동 위치나 이동 목적지의 구체적 URL 경로(예: \`/login\`, \`/admin/orders\`, \`/addresses\` 등)를 문두나 문장 내에 명시하세요.
   - [나쁜 예] "고객이 로그인하면 대시보드로 이동함"
   - [좋은 예] "\`/login\`에서 올바른 계정 정보 입력 후 로그인 성공 시 \`/orders\`로 이동 확인"
5. 명사 단어형 종결 (체언 종결) 및 부정/차단 케이스 필수 포함: 모든 문장의 끝은 '~됨', '~함', '~한다', '~된다' 등의 서술형/접미사 어미를 쓰지 말고, 반드시 순수 명사 단어('확인', '가능', '완료', '노출', '유지', '이동', '표시', '차단', '제한' 등)로 끝내세요. 또한 성공 흐름뿐 아니라 비인가 접근이나 잘못된 변경을 막는 차단/예외 케이스를 반드시 포함하세요.
   - [나쁜 예] "일반 유저는 관리자 페이지에 못 들어감", "취소 버튼을 누르면 주문이 취소된다"
   - [좋은 예 - 성공] "\`/signup\`에서 필수 정보 입력 후 가입 완료 시 계정 생성 완료", "\`/orders/:id\`에서 '픽업 대기' 상태 주문 취소 시 '취소됨' 상태 변경 확인"
   - [좋은 예 - 차단/보안] "일반 고객 계정으로 \`/admin\` 직접 접근 시도시 접근 차단 및 권한 오류 안내 표시", "\`/orders/:id\`에서 '픽업 완료' 이후 주문에는 취소 버튼 비활성화 및 관리자 문의 안내 표시"
6. 예산의 차등 분배 (기계적 균등 분배 금지): 마일스톤 예산을 단순 N분의 1로 나누지 마십시오. 난이도 높은 마일스톤에 가중치를 더 부여하세요.
7. 마무리 범위 보존: 원문에 없는 작업(QA, 배포 등)이나 비용은 임의로 추가하지 마세요.

[추출 항목]
1. 마일스톤 분할 및 세부 정보: (최소 5개 ~ 최대 10개)
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
  console.log("Reading EXP_7_Laundry_Pickup_Delivery.md...");
  const filePath = path.join(__dirname, 'EXP_7_Laundry_Pickup_Delivery.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract prompt between '## 📝 입력 프롬프트 (요구사항)' and '## 🎯 예상 마일스톤'
  const promptMatch = content.match(/## 📝 입력 프롬프트 \(요구사항\)([\s\S]*?)## 🎯 예상 마일스톤/);
  if (!promptMatch) {
    console.error("Could not find input prompt in EXP_7_Laundry_Pickup_Delivery.md");
    return;
  }

  const promptText = promptMatch[1].replace(/---/g, '').trim();
  console.log(`Prompt text extracted (Length: ${promptText.length} chars)`);

  console.log("Sending request to LLM (gpt-4o)...");
  const startTime = Date.now();
  const result = await analyzeWorkDetailWithLLM(promptText);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`LLM Analysis completed in ${duration}s!`);

  const outPath = path.join(__dirname, 'EXP_7_LLM_Result.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Saved LLM result to ${outPath}`);
}

main().catch(console.error);
