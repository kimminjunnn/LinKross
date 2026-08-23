/**
 * 프리셋 A의 마일스톤 하나를 PR 제출 → 검수 실행까지 태운다.
 *
 * 프로덕션 화면(프리랜서의 PR 제출 → 발주자의 검수 요청)이 만드는 행과 같은
 * 모양으로 넣는다(`src/lib/backend/verification.ts`). 그 다음 배포본의 조정기
 * 엔드포인트를 직접 호출해 Vercel Sandbox 실행을 시작한다.
 *
 * 실행: node --import ./eval/load-env.mjs eval/presets/run-asset-rental-verification.mjs M1
 */
import fs from "node:fs";

const PROJECT_ID = "057f6e3a-f141-486f-9633-ba8a3d0d144c";
const FREELANCER = "0a93c5d0-2d40-40af-90a5-8ed34179f0de";
const COMPANY = "97ef85c7-dea9-41ed-9907-17a7815633ca";
const APP = process.env.LINKROSS_APP_URL ?? "https://lin-kross.vercel.app";

const code = (process.argv[2] ?? "M1").toUpperCase();
const preset = JSON.parse(fs.readFileSync("eval/presets/asset-rental.sow.json", "utf8"));
const target = preset.results[0].milestones.find((m) => m.code === code);
if (!target) throw new Error(`마일스톤 ${code}를 프리셋에서 찾지 못했습니다.`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
async function rest(path, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const [milestone] = await rest(`milestones?project_id=eq.${PROJECT_ID}&code=eq.${code}&select=id,code,title`);
const [repo] = await rest(`project_repositories?project_id=eq.${PROJECT_ID}&select=id`);
const criteria = await rest(`completion_criteria?milestone_id=eq.${milestone.id}&select=id,position&order=position`);
console.log(`${code} ${milestone.title} · 완료조건 ${criteria.length}건`);

// ── PR 제출 ────────────────────────────────────────────────────────────────
let [submission] = await rest(
  `milestone_submissions?milestone_id=eq.${milestone.id}&head_commit_sha=eq.${target.commit}&select=id,attempt_number`,
);
if (submission) {
  console.log(`기존 제출 재사용 · attempt ${submission.attempt_number}`);
  // 완료조건을 고친 뒤 다시 돌릴 때, 새로 생긴 조건이 청구 목록에서 빠져 있으면
  // 검수 대상에서 조용히 사라진다. 빠진 것만 채운다.
  const claimed = await rest(`milestone_submission_criteria?submission_id=eq.${submission.id}&select=criterion_id`);
  const have = new Set(claimed.map((c) => c.criterion_id));
  const missing = criteria.filter((c) => !have.has(c.id));
  if (missing.length > 0) {
    await rest("milestone_submission_criteria", {
      method: "POST",
      body: JSON.stringify(
        missing.map((c) => ({ submission_id: submission.id, milestone_id: milestone.id, criterion_id: c.id })),
      ),
    });
    console.log(`청구 목록 보강 ${missing.length}건`);
  }
} else {
  const prev = await rest(
    `milestone_submissions?milestone_id=eq.${milestone.id}&select=id,attempt_number&order=attempt_number.desc&limit=1`,
  );
  [submission] = await rest("milestone_submissions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      project_id: PROJECT_ID,
      milestone_id: milestone.id,
      repository_id: repo.id,
      attempt_number: (prev[0]?.attempt_number ?? 0) + 1,
      pull_request_number: target.pr,
      pull_request_title: `[${code}] ${target.title}`,
      pull_request_url: `https://github.com/kimminjunnn/linkross-github-app-test/pull/${target.pr}`,
      head_branch: target.branch,
      head_commit_sha: target.commit,
      implementation_note: `${code} 구현분입니다. ${target.branch} 브랜치의 ${target.commit.slice(0, 7)} 커밋 기준으로 확인 부탁드립니다.`,
      submitted_by: FREELANCER,
      previous_submission_id: prev[0]?.id ?? null,
    }),
  });
  await rest("milestone_submission_criteria", {
    method: "POST",
    body: JSON.stringify(
      criteria.map((c) => ({ submission_id: submission.id, milestone_id: milestone.id, criterion_id: c.id })),
    ),
  });
  console.log(`PR #${target.pr} 제출 · ${target.commit.slice(0, 7)} · 조건 ${criteria.length}건 청구`);
}

// ── 검수 요청 ──────────────────────────────────────────────────────────────
const prevRuns = await rest(
  `verification_runs?submission_id=eq.${submission.id}&scope=eq.milestone&select=id,status,attempt_number&order=attempt_number.desc&limit=1`,
);
const ACTIVE = ["queued", "provisioning", "installing", "building", "running"];
let run = prevRuns[0];
if (run && ACTIVE.includes(run.status)) {
  console.log(`진행 중인 검수 재사용 · ${run.status}`);
} else {
  const attempt = (run?.attempt_number ?? 0) + 1;
  [run] = await rest("verification_runs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      project_id: PROJECT_ID,
      milestone_id: milestone.id,
      submission_id: submission.id,
      scope: "milestone",
      requested_criterion_id: null,
      attempt_number: attempt,
      idempotency_key: [submission.id, "milestone", "all", attempt].join(":"),
      status: "queued",
      requested_by: COMPANY,
    }),
  });
  console.log(`검수 요청 생성 · run ${run.id} · attempt ${attempt}`);
}

// ── 조정기 호출 ────────────────────────────────────────────────────────────
const workerId = `preset-${code.toLowerCase()}-${Date.now().toString(36)}`;
const res = await fetch(`${APP}/api/verification/runner/execute`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.VERIFICATION_RUNNER_SECRET}`, "Content-Type": "application/json" },
  body: JSON.stringify({ workerId }),
});
console.log(`조정기 응답 ${res.status}: ${(await res.text()).slice(0, 500)}`);
console.log(`\nrun id: ${run.id}`);
