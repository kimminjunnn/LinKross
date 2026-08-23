/**
 * 프리셋 프로젝트의 완료조건 문장을 바꾸고 검수 계약을 다시 만든다.
 *
 * 검수를 돌려 보면 제품이 아니라 계약(조합된 Playwright 원자)이 틀려서 실패하는
 * 건이 나온다. 화면 구조와 어휘의 한계 때문이며, 문장을 화면에 맞게 고치면
 * 해결된다. 완료조건 행은 이미 제출·검수 이력이 걸려 있어 지울 수 없으므로
 * 자리(position)를 찾아 갱신하고, 자리가 없으면 새로 넣는다.
 *
 * 실행:
 *   node --experimental-strip-types --conditions=react-server \
 *     --import ./eval/load-env.mjs --import ./scripts/register-test-hooks.mjs \
 *     eval/presets/patch-dods.mjs M2 '[{"position":1,"text":"..."}]'
 *   (두 번째 인자 대신 --file <경로>로 JSON 파일을 줄 수 있다)
 */
import fs from "node:fs";

import { analyzeDodContracts } from "@/lib/dod-contract-analyzer";
import { applyAnswersToContract, extractContractPath } from "@/lib/dod-test-contract";
import { resolveDesign, unansweredRequirements } from "@/lib/dod-verification-state";
import { createMvpVerificationDefinition } from "@/lib/verification-test-spec";
import { composeVerificationAtoms } from "@/lib/verification-atom-composer";

const PROJECT = "057f6e3a-f141-486f-9633-ba8a3d0d144c";
const code = (process.argv[2] ?? "").toUpperCase();
const fileFlag = process.argv.indexOf("--file");
const patches = JSON.parse(
  fileFlag > -1 ? fs.readFileSync(process.argv[fileFlag + 1], "utf8") : process.argv[3],
);
const forceManual = process.argv.includes("--manual");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const rest = async (p, init = {}) => {
  const r = await fetch(`${url}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${init.method ?? "GET"} ${p} → ${r.status} ${t}`);
  return t ? JSON.parse(t) : null;
};

const [ms] = await rest(`milestones?project_id=eq.${PROJECT}&code=eq.${code}&select=id,title,sow_version_id`);
const existing = await rest(`completion_criteria?milestone_id=eq.${ms.id}&select=id,position&order=position`);
const byPosition = new Map(existing.map((c) => [c.position, c]));
console.log(`${code} ${ms.title} · 기존 ${existing.length}건 · 패치 ${patches.length}건`);

const analyses = forceManual
  ? patches.map(() => null)
  : await analyzeDodContracts(patches.map((p) => ({ milestoneTitle: ms.title, dod: p.text })));

const prepared = patches.map((patch, i) => {
  const a = analyses[i];
  const requirements = (a?.requirements ?? []).map((r) => ({
    ...r, answer: r.answer?.trim() || r.recommendedSuggestion || r.suggestions?.[0] || "",
  }));
  return {
    ...patch,
    requirements,
    contract: a ? applyAnswersToContract(a.testContract, requirements) : undefined,
  };
});

const out = new Array(prepared.length);
const pending = [];
prepared.forEach((e, i) => {
  const startPath = e.contract?.startPath ?? extractContractPath(e.text) ?? undefined;
  const description = extractContractPath(e.text) || !startPath ? e.text : `\`${startPath}\`에서 ${e.text}`;
  if (forceManual || !e.contract || unansweredRequirements(e.requirements).length > 0) {
    out[i] = { ...e, description, method: "manual", spec: {} };
    return;
  }
  const preset = createMvpVerificationDefinition(description);
  if (preset.verificationMethod === "automated_e2e") {
    out[i] = { ...e, description, method: "automated_e2e", spec: preset.testSpec };
    return;
  }
  out[i] = { ...e, description, method: "manual", spec: {} };
  pending.push(i);
});

if (pending.length > 0) {
  const composed = await composeVerificationAtoms(pending.map((i) => ({
    description: out[i].description,
    contract: out[i].contract,
    answeredFields: (out[i].requirements ?? []).filter((r) => r.answer?.trim()).map((r) => r.key),
  })));
  pending.forEach((i, k) => {
    if (composed[k]?.spec) out[i] = { ...out[i], method: "automated_e2e", spec: composed[k].spec };
  });
}

for (const entry of out) {
  const design = resolveDesign({
    requirements: entry.requirements ?? [],
    contract: entry.contract,
    hasExecutableSpec: entry.method === "automated_e2e",
    startPath: entry.contract?.startPath,
  }).design;
  const auto = !forceManual && design.status === "automation_ready";
  const row = {
    description: entry.description,
    verification_method: auto ? "automated_e2e" : "manual",
    position: entry.position,
    test_spec: {
      ...(auto ? entry.spec : {}),
      verificationDesign: {
        version: 1,
        status: forceManual ? "human_review_required" : design.status,
        ...(design.startPath ? { startPath: design.startPath } : {}),
        ...(design.testHint ? { testHint: design.testHint } : {}),
        ...(design.requirements ? { requirements: design.requirements } : {}),
        ...(design.testContract ? { testContract: design.testContract } : {}),
        ...(design.conversation ? { conversation: design.conversation } : {}),
        questionSetLocked: design.questionSetLocked === true,
        humanReviewAccepted: forceManual ? true : design.humanReviewAccepted === true,
        message: forceManual
          ? "화면 구조상 자동 판정이 어려워 Preview에서 사람이 확인합니다."
          : design.message ?? "검수 설계 상태를 확인해 주세요.",
      },
    },
  };
  const hit = byPosition.get(entry.position);
  if (hit) {
    await rest(`completion_criteria?id=eq.${hit.id}`, { method: "PATCH", body: JSON.stringify(row) });
    console.log(`  갱신 ${entry.position}. [${row.verification_method === "automated_e2e" ? "자동" : "확인필요"}] ${entry.description}`);
  } else {
    await rest("completion_criteria", { method: "POST", body: JSON.stringify({
      project_id: PROJECT, sow_version_id: ms.sow_version_id, milestone_id: ms.id,
      kind: "definition_of_done", is_required: true, ...row,
    }) });
    console.log(`  추가 ${entry.position}. [${row.verification_method === "automated_e2e" ? "자동" : "확인필요"}] ${entry.description}`);
  }
}
