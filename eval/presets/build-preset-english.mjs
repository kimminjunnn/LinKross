/**
 * 프리셋에 얼려 둘 영문 SOW 초안과 승인 화면 요약을 만든다.
 *
 * `build-sow-preset.mjs`가 LLM을 부르지 않는 것과 달리, 이 생성기는 한 번만
 * 부른다. 결과를 `eval/presets/<id>.preset-source.json`에 적어 두면 그 뒤로는
 * 화면이 프리셋에서 꺼내 쓰고 LLM 경로를 타지 않는다. 사람이 읽고 고칠 수 있게
 * 원천 파일에 남기는 것이지, 실행할 때마다 다시 만들라는 뜻이 아니다.
 *
 * 프롬프트와 스키마는 제품과 공유한다(`@/lib/sow-english-prompt`,
 * `@/lib/sow-summary-prompt`). 여기서만 쓰는 프롬프트를 따로 두면 얼려 둔 결과와
 * LLM 경로의 결과가 서로 다른 물건이 된다.
 *
 * 만드는 것은 세 가지다. 영문 SOW 초안, 승인 화면 요약, 그리고 업무 상세 원문의
 * 영문이다. 이미 채워진 것은 다시 만들지 않는다. 무료 등급은 모델당 하루 20회라
 * 한 항목을 채우려고 나머지 둘까지 다시 부르면 그날 할당량이 끝난다.
 * 전부 새로 만들려면 `--force`를 준다.
 *
 * 실행:
 *   node --experimental-strip-types --import ./eval/load-env.mjs \
 *     --import ./scripts/register-test-hooks.mjs \
 *     eval/presets/build-preset-english.mjs asset-rental [--model gemini-3.6-flash] [--force]
 */
import fs from "node:fs";

import { TRANSLATION_SYSTEM_MESSAGE } from "@/lib/backend/translation";
import { generateJson, generateText, geminiModel } from "@/lib/llm/gemini";
import { retrieveGlossaryTerms } from "@/lib/rag-translator";
import {
  ENGLISH_SOW_RESPONSE_SCHEMA,
  ENGLISH_SOW_SYSTEM_MESSAGE,
  buildEnglishSowPrompt,
} from "@/lib/sow-english-prompt";
import {
  SOW_SUMMARY_SCHEMA,
  SOW_SUMMARY_SYSTEM_MESSAGE,
  buildSowSummaryPrompt,
} from "@/lib/sow-summary-prompt";

const args = process.argv.slice(2);
const presetId = args.find((arg) => !arg.startsWith("--"));
if (!presetId) {
  console.error("사용법: build-preset-english.mjs <preset-id> [--model <name>]");
  process.exit(1);
}
const model = args.includes("--model") ? args[args.indexOf("--model") + 1] : geminiModel();
const force = args.includes("--force");

const sourcePath = `eval/presets/${presetId}.txt`;
const definitionPath = `eval/presets/${presetId}.preset-source.json`;
const workDetail = fs.readFileSync(sourcePath, "utf8");
const definition = JSON.parse(fs.readFileSync(definitionPath, "utf8"));

const milestones = definition.milestones.map((milestone) => ({
  title: milestone.title,
  dods: milestone.dods.map((dod) => dod.description),
}));
const { startDate, endDate } = presetPeriodBounds(definition.milestones);

console.log(`모델 ${model} · 마일스톤 ${milestones.length}개 · DoD ${milestones.reduce((n, m) => n + m.dods.length, 0)}개`);

// 1. 영문 SOW 초안
const glossary = retrieveGlossaryTerms(
  `${workDetail} ${milestones.flatMap((m) => [m.title, ...m.dods]).join(" ")}`,
);
let englishSow = definition.englishSow ?? null;
let generated = false;

if (englishSow && !force) {
  console.log("  영문 초안 건너뜀 (이미 있음, 다시 만들려면 --force)");
} else {
  const started = Date.now();
  const { parsed, usage } = await generateJson({
    model,
    system: ENGLISH_SOW_SYSTEM_MESSAGE,
    user: buildEnglishSowPrompt({ workDetail, startDate, endDate, milestones, glossary }),
    schema: ENGLISH_SOW_RESPONSE_SCHEMA,
    temperature: 0.1,
  });
  if (!parsed) {
    console.error("영문 SOW 초안을 받지 못했습니다(응답이 잘렸거나 JSON이 아님).");
    process.exit(1);
  }
  if (parsed.translatedMilestones.length !== milestones.length) {
    console.error(
      `마일스톤 개수가 맞지 않습니다: 기대 ${milestones.length} · 응답 ${parsed.translatedMilestones.length}`,
    );
    process.exit(1);
  }
  const dodMismatch = parsed.translatedMilestones.findIndex(
    (translated, index) => translated.dodsEn.length !== milestones[index].dods.length,
  );
  if (dodMismatch >= 0) {
    console.error(
      `${milestones[dodMismatch].title}의 DoD 개수가 맞지 않습니다: ` +
        `기대 ${milestones[dodMismatch].dods.length} · 응답 ${parsed.translatedMilestones[dodMismatch].dodsEn.length}`,
    );
    process.exit(1);
  }
  englishSow = parsed;
  generated = true;
  console.log(`  영문 초안 ${Date.now() - started}ms · 토큰 ${JSON.stringify(usage)}`);
}

// 2. 승인 화면 요약. 화면과 같은 순서로, 앞서 만든 영문 초안을 입력으로 쓴다.
let sowSummary = definition.sowSummary ?? null;

if (sowSummary && !force) {
  console.log("  요약 건너뜀 (이미 있음, 다시 만들려면 --force)");
} else {
  const started = Date.now();
  const { parsed, usage } = await generateJson({
    model,
    system: SOW_SUMMARY_SYSTEM_MESSAGE,
    user: buildSowSummaryPrompt({
      workDetailKo: workDetail,
      englishSowBackground: englishSow.background,
      englishSowObjective: englishSow.objective,
      acceptanceCriteria: englishSow.acceptanceCriteria,
      definitionOfDone: englishSow.definitionOfDone,
    }),
    schema: SOW_SUMMARY_SCHEMA,
    temperature: 0.2,
  });
  if (!parsed) {
    console.error("승인 화면 요약을 받지 못했습니다.");
    process.exit(1);
  }
  sowSummary = parsed;
  generated = true;
  console.log(`  요약 ${Date.now() - started}ms · 토큰 ${JSON.stringify(usage)}`);
}

// 3. 업무 상세 원문의 영문. SOW 승인 화면의 `Korean Work Details` 절이 쓴다.
//    제품의 번역 경로와 같은 프롬프트를 써야 얼려 둔 문장과 성격이 갈리지 않는다.
let sourceTextEn = definition.sourceTextEn ?? null;

if (sourceTextEn && !force) {
  console.log("  원문 영문 건너뜀 (이미 있음, 다시 만들려면 --force)");
} else {
  const started = Date.now();
  const translated = await generateText({
    model,
    system: TRANSLATION_SYSTEM_MESSAGE,
    user: workDetail.trim(),
    temperature: 0.1,
    // 8천 자 원문이라 기본 4,096 토큰으로는 뒷부분이 잘린다.
    maxOutputTokens: 16_384,
  });
  if (!translated) {
    console.error("업무 상세 원문의 영문을 받지 못했습니다.");
    process.exit(1);
  }
  // 잘린 응답을 그대로 얼려 두면 시연에서 문서 끝이 사라진다. 문단 수로 확인한다.
  const koreanParagraphs = workDetail.trim().split(/\n\s*\n/).length;
  const englishParagraphs = translated.split(/\n\s*\n/).length;
  if (englishParagraphs < koreanParagraphs * 0.7) {
    console.error(
      `영문이 잘린 것으로 보입니다: 한국어 문단 ${koreanParagraphs}개 · 영문 문단 ${englishParagraphs}개`,
    );
    process.exit(1);
  }
  sourceTextEn = translated;
  generated = true;
  console.log(`  원문 영문 ${Date.now() - started}ms · ${translated.length}자`);
}

if (!generated) {
  console.log("\n새로 만든 것이 없습니다. 다시 만들려면 --force를 주세요.");
  process.exit(0);
}

definition.englishSow = englishSow;
definition.sowSummary = sowSummary;
definition.sourceTextEn = sourceTextEn;
definition.englishSowProvenance = `${model}로 ${new Date().toISOString().slice(0, 10)}에 생성. 사람이 읽고 확정한 값이다.`;
fs.writeFileSync(definitionPath, `${JSON.stringify(definition, null, 2)}\n`, "utf8");

console.log(`\n${definitionPath}에 기록했습니다. 내용을 확인한 뒤 build-sow-preset.mjs를 다시 돌리세요.`);
console.log(`\n--- 확인용 ---`);
console.log(`Background: ${englishSow.background}`);
console.log(`Objective:  ${englishSow.objective}`);
console.log(`In scope:   ${englishSow.inScope.length}건 · Out of scope: ${englishSow.outOfScope.length}건`);
console.log(`AC ${englishSow.acceptanceCriteria.length}건 · DoD ${englishSow.definitionOfDone.length}건 · 미매핑 ${englishSow.unmappedContent.length}건`);
console.log(`요약(핵심 범위): ${sowSummary.coreScope}`);
console.log(`요약(검수 기준): ${sowSummary.keyAcceptance}`);
console.log(`요약(확인 필요): ${sowSummary.needsReview}`);
console.log(`원문 영문 첫 줄: ${sourceTextEn.split("\n")[0]}`);

/** 프리셋 마일스톤의 `26.08.22 - 26.09.12` 표기에서 전체 기간을 뽑는다. */
function presetPeriodBounds(presetMilestones) {
  const dates = presetMilestones.flatMap((milestone) => {
    const match = milestone.period.match(/(\d{2})\.(\d{2})\.(\d{2})\s*-\s*(\d{2})\.(\d{2})\.(\d{2})/);
    if (!match) return [];
    return [`20${match[1]}-${match[2]}-${match[3]}`, `20${match[4]}-${match[5]}-${match[6]}`];
  });
  dates.sort();
  return { startDate: dates[0] ?? "", endDate: dates[dates.length - 1] ?? "" };
}
