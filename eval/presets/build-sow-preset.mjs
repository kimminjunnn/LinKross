/**
 * 시연용 SOW 프리셋 데이터 파일을 만든다.
 *
 * 입력은 사람이 읽고 고치는 원천 파일 `eval/presets/<id>.preset-source.json`과
 * 발주자 원문 `eval/presets/<id>.txt`이고, 출력은 앱이 그대로 읽는
 * `src/lib/sow-presets/data/<id>.ts`다.
 *
 * 완료조건 문장과 실행 스펙은 LLM으로 매번 다시 만들지 않는다. 프리셋의 목적이
 * "같은 원문에는 항상 같은 결과"이기 때문이다. 대신 원천 파일에 적힌 스펙을
 * 프로덕션과 같은 엄격 파서로 확인하고, 검수 설계 상태는 프로덕션과 같은 판정
 * 함수(`resolveDesign`)로 만든다. 그래서 여기서 통과한 것만 자동 검수로 나간다.
 *
 * 스펙이 실제로 통과하는지는 `eval/presets/verify-preset-locally.mjs`가
 * 검수 실행기와 같은 Playwright 하니스로 확인한다.
 *
 * 실행:
 *   node --experimental-strip-types --import ./scripts/register-test-hooks.mjs \
 *     eval/presets/build-sow-preset.mjs asset-rental
 */
import fs from "node:fs";

import { resolveDesign } from "@/lib/dod-verification-state";
import {
  MANUAL_GUIDANCE_SPEC_VERSION,
  parseManagedApiCheckTestSpec,
  parseManagedBrowserAtomTestSpec,
  parseManagedBrowserTestSpec,
  parseManualGuidanceSpec,
} from "@/lib/verification-test-spec";

const presetId = process.argv[2];
if (!presetId) {
  console.error("사용법: build-sow-preset.mjs <preset-id>  (예: asset-rental)");
  process.exit(1);
}

const sourcePath = `eval/presets/${presetId}.txt`;
const definitionPath = `eval/presets/${presetId}.preset-source.json`;
const outputPath = `src/lib/sow-presets/data/${presetId}.ts`;

const sourceText = fs.readFileSync(sourcePath, "utf8");
const definition = JSON.parse(fs.readFileSync(definitionPath, "utf8"));

function parseExecutable(spec) {
  return (
    parseManagedApiCheckTestSpec(spec)
    ?? parseManagedBrowserAtomTestSpec(spec)
    ?? parseManagedBrowserTestSpec(spec)
  );
}

const problems = [];
let autoTotal = 0;
let manualTotal = 0;

const milestones = definition.milestones.map((milestone) => ({
  code: milestone.code,
  title: milestone.title,
  period: milestone.period,
  amount: String(milestone.amount),
  dods: milestone.dods.map((dod, index) => {
    const where = `${milestone.code}#${index + 1}`;
    const wantsAutomation = dod.verification === "auto";
    const executable = wantsAutomation ? parseExecutable(dod.testSpec) : null;
    if (wantsAutomation && !executable) {
      problems.push(`${where} 자동으로 표시됐지만 실행 스펙을 해석하지 못했습니다: ${dod.description}`);
    }
    const guidance = dod.guidance
      ? parseManualGuidanceSpec({ version: MANUAL_GUIDANCE_SPEC_VERSION, kind: "manual_guidance", ...dod.guidance })
      : null;
    if (!wantsAutomation && !guidance) {
      problems.push(`${where} 사람 확인 항목인데 안내(guidance)가 없거나 형식이 어긋납니다: ${dod.description}`);
    }

    const automated = Boolean(executable);
    if (automated) autoTotal += 1; else manualTotal += 1;

    // 프리셋은 질문을 남기지 않는다. 사람 확인 항목은 이미 확정된 것으로 둔다.
    const { design } = resolveDesign({
      requirements: [],
      contract: dod.contract,
      hasExecutableSpec: automated,
      humanReviewAccepted: !automated,
      startPath: dod.contract?.startPath,
      ...(guidance ? { manualGuidance: { location: guidance.location, method: guidance.method, expected: guidance.expected } } : {}),
    });

    return {
      description: dod.description,
      verificationMethod: automated ? "automated_e2e" : "manual",
      testSpec: automated ? executable : (guidance ?? {}),
      design,
    };
  }),
}));

for (const milestone of milestones) {
  const autos = milestone.dods.filter((dod) => dod.verificationMethod === "automated_e2e").length;
  console.log(`${milestone.code} ${milestone.title} · 전체 ${milestone.dods.length} · 자동 ${autos} · 사람 확인 ${milestone.dods.length - autos}`);
}
console.log(`\n합계 자동 ${autoTotal} · 사람 확인 ${manualTotal}`);

// 영문 SOW 초안과 승인 요약은 `build-preset-english.mjs`가 한 번 만들어 원천 파일에
// 적어 둔 값이다. 여기서는 다시 만들지 않고, 마일스톤 구성과 어긋나지 않는지만 본다.
// 어긋난 채로 실어 보내면 화면이 프리셋을 꺼내 쓰고도 틀린 문서를 보여준다.
const englishSow = definition.englishSow ?? null;
if (englishSow) {
  if (englishSow.translatedMilestones?.length !== milestones.length) {
    problems.push(
      `englishSow.translatedMilestones 개수가 마일스톤과 다릅니다: `
      + `${englishSow.translatedMilestones?.length ?? 0} vs ${milestones.length}`,
    );
  } else {
    englishSow.translatedMilestones.forEach((translated, index) => {
      if (translated.dodsEn?.length !== milestones[index].dods.length) {
        problems.push(
          `${milestones[index].code} englishSow의 DoD 개수가 다릅니다: `
          + `${translated.dodsEn?.length ?? 0} vs ${milestones[index].dods.length}`,
        );
      }
    });
  }
}

const sourceTextEn = typeof definition.sourceTextEn === "string" ? definition.sourceTextEn.trim() : "";
if (definition.sourceTextEn !== undefined && !sourceTextEn) {
  problems.push("sourceTextEn이 비어 있습니다. 지우거나 채우세요.");
}

const sowSummary = definition.sowSummary ?? null;
if (sowSummary) {
  for (const key of ["coreScope", "keyAcceptance", "needsReview"]) {
    if (!sowSummary[key]?.trim()) problems.push(`sowSummary.${key}가 비어 있습니다.`);
    if (!sowSummary.english?.[key]?.trim()) problems.push(`sowSummary.english.${key}가 비어 있습니다.`);
  }
}

console.log(
  `영문 초안 ${englishSow ? "있음" : "없음"} · 승인 요약 ${sowSummary ? "있음" : "없음"}`
  + ` · 원문 영문 ${sourceTextEn ? "있음" : "없음"}`
  + `${englishSow || sowSummary ? "" : " (해당 화면은 LLM 경로로 갑니다)"}`,
);

if (problems.length > 0) {
  console.error(`\n${problems.length}건을 고쳐야 합니다:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const constantName = `${presetId.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}_PRESET`;
const literal = (text) => "`" + text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
const payload = {
  id: definition.id,
  label: definition.label,
  provenance: `${definitionPath}에서 생성. 대상 저장소 ${definition.repository}. 자동 ${autoTotal}개는 eval/presets/verify-preset-locally.mjs로 실제 브라우저 통과를 확인했다.`
    + (definition.englishSowProvenance ? ` 영문 초안·요약은 ${definition.englishSowProvenance}` : ""),
  sourceText: "__SOURCE_TEXT__",
  ...(sourceTextEn ? { sourceTextEn: "__SOURCE_TEXT_EN__" } : {}),
  milestones,
  ...(englishSow ? { englishSow } : {}),
  ...(sowSummary ? { sowSummary } : {}),
};

const body = JSON.stringify(payload, null, 2)
  .replace(/^/gm, "  ")
  .trimStart()
  .replace('"__SOURCE_TEXT__"', "SOURCE_TEXT")
  .replace('"__SOURCE_TEXT_EN__"', "SOURCE_TEXT_EN");

fs.writeFileSync(
  outputPath,
  `/**
 * 생성 파일 — 손으로 고치지 마세요.
 *
 * ${definitionPath}와 ${sourcePath}에서 eval/presets/build-sow-preset.mjs가 만들었습니다.
 * 완료조건이나 실행 스펙을 바꾸려면 원천 파일을 고치고 생성기를 다시 돌립니다.
 */
import type { SowPreset } from "@/lib/sow-presets/types";

const SOURCE_TEXT = ${literal(sourceText)};
${sourceTextEn ? `const SOURCE_TEXT_EN = ${literal(sourceTextEn)};\n` : ""}

export const ${constantName}: SowPreset = ${body};
`,
  "utf8",
);
console.log(`\n${outputPath}에 기록했습니다.`);
