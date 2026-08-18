import fs from "fs";
import path from "path";
import OpenAI from "openai";
import glossaryData from "../src/data/rag-glossary.json";

const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...vals] = line.split("=");
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
  process.exit(1);
}

// ----------------------------------------------------
// 타입 정의
// ----------------------------------------------------
type Dataset = {
  id: number;
  projectTitle: string;
  budget: string;
  period: string;
  startDate: string;
  endDate: string;
  properNouns: string;
  workDetail: string;
};

type MilestoneInput = {
  id: string;
  code: string;
  title: string;
  period: string;
  amount: string;
  dods: string[];
};

type EnglishSOWResult = {
  timelineAndMilestones: Array<{
    code: string;
    titleEn: string;
    period: string;
    amount: string;
    dodsEn: string[];
  }>;
};

// ----------------------------------------------------
// Rule-based 로직 구현
// ----------------------------------------------------
const GLOSSARY = glossaryData.map((item) => ({
  pattern: new RegExp(item.pattern, "gi"),
  english: item.english,
}));

function ruleBasedAnalyze(dataset: Dataset) {
  // 1. 단순 문장 분할
  const sentences = dataset.workDetail
    .split(".")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // 2. 임의로 3개로 자르거나 문장 수만큼 마일스톤 생성
  const milestones: MilestoneInput[] = sentences.map((sentence, index) => {
    // 단순 균등 분배 예산
    const totalBudget = parseInt(dataset.budget.replace(/[^0-9]/g, ""), 10) || 0;
    const amountStr = Math.floor(totalBudget / sentences.length).toString();

    return {
      id: `m-${index + 1}`,
      code: `M${index + 1}`,
      title: `마일스톤 ${index + 1}`,
      period: dataset.period, // 기간 분할 없이 전체 동일하게
      amount: amountStr,
      dods: [sentence],
    };
  });

  return milestones;
}

function ruleBasedTranslate(milestones: MilestoneInput[], text: string) {
  // 영어 번역이 불가능하므로, 한글 텍스트에 정의된 사전을 매칭하여 일부 단어만 영문으로 치환
  let translatedText = text;
  GLOSSARY.forEach(({ pattern, english }) => {
    translatedText = translatedText.replace(pattern, english);
  });

  const timelineAndMilestones = milestones.map((m) => {
    let titleEn = m.title;
    let dodsEn = m.dods.map((d) => d);

    GLOSSARY.forEach(({ pattern, english }) => {
      titleEn = titleEn.replace(pattern, english);
      dodsEn = dodsEn.map((d) => d.replace(pattern, english));
    });

    return {
      ...m,
      titleEn,
      dodsEn,
    };
  });

  return { timelineAndMilestones, translatedText };
}

// ----------------------------------------------------
// LLM 로직 구현 (실제 프로덕션 코드 복제)
// ----------------------------------------------------
async function llmAnalyze(dataset: Dataset): Promise<MilestoneInput[]> {
  const prompt = `
당신은 매우 엄격한 QA 엔지니어이자 외주 개발 계약(SOW) 전문가입니다.
사용자가 작성한 한국어 '업무 상세 내용'을 분석하여 다음 사항을 추출하고 구성하되, 아래의 [필수 규칙]을 반드시 엄수하십시오.

[필수 규칙 - 절대 누락 금지]
1. 세부 제약 조건 보존: 원문 텍스트에 기재된 사소한 제약조건을 절대 임의로 요약하거나 생략하지 마세요.
2. 예산의 차등 분배 (기계적 균등 분배 금지): 마일스톤 예산을 단순 N분의 1로 나누지 마십시오. 난이도 높은 마일스톤에 예산 가중치를 더 부여하세요.
3. 마무리 범위 보존: 원문에 명시된 경우에만 추가하세요.
4. Playwright E2E 테스트용 DoD 작성.

[추출 항목]
1. 마일스톤 분할 및 세부 정보: (최소 1개 이상, 개수 제한 없음)
   - period: 전체 기간(${dataset.startDate} ~ ${dataset.endDate}) 내에서 비율에 맞게 'YY.MM.DD - YY.MM.DD' 배분
   - amount: 전체 예산을 난이도에 맞게 차등 분배 (숫자 단위)
   - dods: E2E 테스트 시나리오(액션+검증) 형태의 완료 조건 배열

분석할 업무 상세 텍스트:
"""
${dataset.workDetail}
"""
`;

  const completion = await openai.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
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
                  id: { type: "string" },
                  code: { type: "string" },
                  title: { type: "string" },
                  period: { type: "string" },
                  amount: { type: "string" },
                  dods: {
                    type: "array",
                    items: { type: "string" },
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

  return completion.choices[0].message.parsed?.milestones || [];
}

async function llmTranslate(dataset: Dataset, milestones: MilestoneInput[]): Promise<EnglishSOWResult> {
  const retrievedTerms = [];
  GLOSSARY.forEach(({ pattern, english }) => {
    if (dataset.workDetail.match(pattern)) {
      retrievedTerms.push({ english });
    }
  });

  const completion = await openai.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content: "You draft plain-English software Statements of Work. Translate Korean to English literally for proper nouns.",
      },
      {
        role: "user",
        content: JSON.stringify({
          source: dataset.workDetail,
          period: dataset.period,
          milestones: milestones.map(({ title, dods }) => ({ title, completionConditions: dods })),
          glossary: retrievedTerms,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "grounded_sow_draft",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            translatedMilestones: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  titleEn: { type: "string" },
                  dodsEn: { type: "array", items: { type: "string" } },
                },
                required: ["titleEn", "dodsEn"],
              },
            },
          },
          required: ["translatedMilestones"],
        },
      },
    },
    temperature: 0.1,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) throw new Error("Translation failed");

  return {
    timelineAndMilestones: milestones.map((m, i) => ({
      ...m,
      titleEn: parsed.translatedMilestones[i]?.titleEn || "",
      dodsEn: parsed.translatedMilestones[i]?.dodsEn || [],
    })),
  };
}

// ----------------------------------------------------
// 메인 벤치마크 루프
// ----------------------------------------------------
async function run() {
  const inputFile = process.argv[2] || "sow_experiment_dataset.txt";
  const datasetPath = path.resolve(__dirname, "../../", inputFile);
  if (!fs.existsSync(datasetPath)) {
    console.error(`File not found: ${datasetPath}`);
    process.exit(1);
  }
  
  const text = fs.readFileSync(datasetPath, "utf-8");
  const rawItems = text.split("=========").map(x => x.trim()).filter(Boolean);

  const datasets: Dataset[] = rawItems.map((item, index) => {
    const lines = item.split("\n").map(l => l.trim());
    const titleLine = lines.find(l => l.startsWith("프로젝트명:") || l.startsWith("[프로젝트명]"));
    const budgetLine = lines.find(l => l.startsWith("예산:") || l.startsWith("[예산]"));
    const periodLine = lines.find(l => l.startsWith("기간:") || l.startsWith("[기간]"));
    const nounLine = lines.find(l => l.startsWith("고유명사:"));
    
    // Find the detail section or just use the whole item
    const detailIndex1 = lines.findIndex(l => l.startsWith("[업무 상세 내용]"));
    const detailIndex2 = lines.findIndex(l => l.startsWith("[업무 상세]"));
    let workDetail = item; // default to the entire text
    if (detailIndex1 !== -1) {
      workDetail = lines.slice(detailIndex1 + 1).join("\n");
    } else if (detailIndex2 !== -1) {
      workDetail = lines.slice(detailIndex2 + 1).join("\n");
    }

    const period = periodLine ? periodLine.replace(/기간:|\[기간\]/g, "").trim() : "2026-01-01 ~ 2026-12-31";
    const dates = period.split("~").map(d => d.trim());

    return {
      id: index + 1,
      projectTitle: titleLine ? titleLine.replace(/프로젝트명:|\[프로젝트명\]/g, "").trim() : `Dataset Item ${index + 1}`,
      budget: budgetLine ? budgetLine.replace(/예산:|\[예산\]/g, "").trim() : "0",
      period,
      startDate: dates[0] || "2026-01-01",
      endDate: dates[1] || "2026-12-31",
      properNouns: nounLine ? nounLine.replace("고유명사:", "").trim() : "",
      workDetail,
    };
  });

  const results = [];

  for (const ds of datasets) {
    console.log(`\n--- Processing Dataset ${ds.id}: ${ds.projectTitle} ---`);

    // Rule-base Benchmark
    const startRbTime = performance.now();
    const rbMilestones = ruleBasedAnalyze(ds);
    const rbTrans = ruleBasedTranslate(rbMilestones, ds.workDetail);
    const endRbTime = performance.now();

    // LLM Benchmark
    let llmMilestones: MilestoneInput[] = [];
    let llmTrans: EnglishSOWResult | null = null;
    let startLlmTime = 0;
    let endLlmTime = 0;

    try {
      startLlmTime = performance.now();
      llmMilestones = await llmAnalyze(ds);
      llmTrans = await llmTranslate(ds, llmMilestones);
      endLlmTime = performance.now();
    } catch (e) {
      console.error("LLM Error:", e);
    }

    results.push({
      datasetId: ds.id,
      title: ds.projectTitle,
      ruleBased: {
        timeMs: endRbTime - startRbTime,
        milestones: rbMilestones,
        translated: rbTrans.timelineAndMilestones,
      },
      llm: {
        timeMs: endLlmTime - startLlmTime,
        milestones: llmMilestones,
        translated: llmTrans?.timelineAndMilestones || [],
      },
    });
  }

  const outputFileName = `benchmark_results_${path.parse(inputFile).name}.json`;
  const outputPath = path.join(__dirname, "../../", outputFileName);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nBenchmark complete. Results written to ${outputPath}`);
}

run().catch(console.error);
