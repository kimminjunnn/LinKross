/**
 * A/B용 SOW 생성기. run-composition-eval.mjs 의 --from 이 읽는 모양으로 떨군다.
 * 프로덕션(analyzeWorkDetailWithLLM)과 같은 모델·온도·스키마를 쓴다.
 */
import fs from "node:fs";
import path from "node:path";
import { generateJson } from "@/lib/llm/gemini";

import { buildSowPrompt, SOW_RESPONSE_SCHEMA, SOW_SYSTEM_MESSAGE } from "@/lib/sow-prompt";

const [, , inputPath, outPath, id] = process.argv;
const raw = fs.readFileSync(inputPath, "utf8");
const workDetail = `예산: 9000 USDC\n\n${raw}`;

const { parsed } = await generateJson({
  system: SOW_SYSTEM_MESSAGE,
  user: buildSowPrompt({ workDetail, startDate: "2026-08-22", endDate: "2026-09-12" }),
  schema: SOW_RESPONSE_SCHEMA,
  temperature: 0.2,
});

// 화면과 같게 앞머리 대괄호 라벨을 걷어낸다 (sow-draft-workspace.tsx:283).
const milestones = parsed.milestones.map((m) => ({
  ...m,
  dods: m.dods.map((d) => d.replace(/^\[.*?\]\s*/, "")),
}));

fs.writeFileSync(path.join(process.cwd(), outPath), JSON.stringify({ results: [{ id, milestones }] }, null, 2));
console.log(`${id}: 마일스톤 ${milestones.length}개 · DoD ${milestones.reduce((n, m) => n + m.dods.length, 0)}개 -> ${outPath}`);
