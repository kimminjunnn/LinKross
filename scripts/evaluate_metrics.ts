import fs from "fs";
import path from "path";
import OpenAI from "openai";

// Load ENV
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

async function run() {
  const fileMap = [
    {
      txt: "../../sow_experiment_dataset.txt",
      json: "../../benchmark_results_sow_experiment_dataset.json",
      name: "Antigravity Dataset"
    },
    {
      txt: "../../kr_work_spec_dataset_v2.txt",
      json: "../../benchmark_results_kr_work_spec_dataset_v2.json",
      name: "Claude Dataset"
    },
    {
      txt: "../../korean_work_detail_dataset_75.txt",
      json: "../../benchmark_results_korean_work_detail_dataset_75.json",
      name: "GPT Dataset"
    }
  ];

  console.log("=== LLM-as-a-Judge 자동 채점 시작 (gpt-4o-mini) ===");

  let totalItems = 0;
  let validMilestoneCount = 0; // 구조적 수치: 마일스톤 2~5개 여부
  let sumTransScore = 0;
  let sumReqScore = 0;

  for (const { txt, json, name } of fileMap) {
    const txtPath = path.resolve(__dirname, txt);
    const jsonPath = path.resolve(__dirname, json);

    if (!fs.existsSync(txtPath) || !fs.existsSync(jsonPath)) continue;

    const rawText = fs.readFileSync(txtPath, "utf-8");
    const rawItems = rawText.split("=========").map(x => x.trim()).filter(Boolean);
    const results = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    console.log(`\nEvaluating ${name}...`);

    let dsTransScore = 0;
    let dsReqScore = 0;

    // 너무 오래 걸리지 않도록 각 데이터셋당 최대 10개만 샘플링하여 평가
    const sampleLimit = Math.min(results.length, 10);
    
    for (let i = 0; i < sampleLimit; i++) {
      const originalText = rawItems[i];
      const llmMilestones = results[i].llm.translated;

      if (!llmMilestones || llmMilestones.length === 0) continue;

      totalItems++;

      // 1. 기계적 구조 준수율 검사
      if (llmMilestones.length >= 2 && llmMilestones.length <= 5) {
        validMilestoneCount++;
      }

      // 2. LLM-as-a-Judge 정성적 평가
      const prompt = `
원문 요구사항 (Korean):
"""
${originalText}
"""

생성된 영문 SOW 마일스톤 및 완료조건 (English):
"""
${JSON.stringify(llmMilestones, null, 2)}
"""

당신은 IT 계약서 검수자입니다. 원문 요구사항을 바탕으로 생성된 영문 SOW를 0~100점 사이로 엄격하게 평가하세요.
1. translationScore (번역 완전성): 원문의 주요 요구사항이 영문으로 누락 없이 정확하게 번역되었는가? (고유명사 보존 여부 포함)
2. requirementsScore (요구사항/우선순위 반영률): 원문에서 강조된 특이사항이나 우선순위가 마일스톤 분할 및 내용에 잘 반영되었는가?

엄격한 기준으로 채점하고 JSON으로 반환하세요.
`;
      try {
        const res = await openai.chat.completions.parse({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "grading",
              schema: {
                type: "object",
                properties: {
                  translationScore: { type: "number" },
                  requirementsScore: { type: "number" }
                },
                required: ["translationScore", "requirementsScore"],
                additionalProperties: false
              },
              strict: true
            }
          }
        });

        const parsed = res.choices[0].message.parsed;
        if (parsed) {
          dsTransScore += parsed.translationScore;
          dsReqScore += parsed.requirementsScore;
          sumTransScore += parsed.translationScore;
          sumReqScore += parsed.requirementsScore;
        }
      } catch (e) {
        console.error(`Error evaluating item ${i}:`, e);
      }
    }

    console.log(`[${name}] 샘플 ${sampleLimit}개 채점 결과`);
    console.log(`- 평균 번역 완전성: ${(dsTransScore / sampleLimit).toFixed(1)}점`);
    console.log(`- 평균 우선순위 반영률: ${(dsReqScore / sampleLimit).toFixed(1)}점`);
  }

  console.log("\n=== 🏆 종합 평가 결과 ===");
  console.log(`총 평가 대상: ${totalItems}개 (샘플링)`);
  console.log(`1. 마일스톤 구조 준수율 (2~5개 생성): ${((validMilestoneCount / totalItems) * 100).toFixed(1)}%`);
  console.log(`2. 번역 완전성 (Translation Accuracy): ${((sumTransScore / totalItems)).toFixed(1)}%`);
  console.log(`3. 요구사항/우선순위 반영률 (Requirements Fulfillment): ${((sumReqScore / totalItems)).toFixed(1)}%`);
}

run().catch(console.error);
