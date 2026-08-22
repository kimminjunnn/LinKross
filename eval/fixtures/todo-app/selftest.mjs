/**
 * 픽스처 자체 검증 — 채점 기준이 맞는지 LLM 없이 확인한다.
 *
 * 픽스처가 틀리면 판정 정확도 측정 전체가 틀린다. 정상판에서 모든 완료조건이
 * 실제로 만족되는지, 그리고 결함을 켜면 대응된 완료조건이 실제로 깨지는지를
 * HTTP 수준에서 직접 확인한다.
 *
 * 결함 간 논리적 의존성(할 일을 추가할 수 없으면 체크할 대상도 없다)은 실패로
 * 세지 않고 참고로만 출력한다. 판정 러너가 완료조건마다 자기 결함 하나만 켜서
 * 실행하므로 그 의존성은 측정에 닿지 않는다.
 *
 * 실행: npm run eval:fixture-selftest
 */
import { spawn } from "node:child_process";

const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;

async function boot(defects) {
  const child = spawn(process.execPath, ["eval/fixtures/todo-app/server.mjs"], {
    env: { ...process.env, PORT: String(PORT), DEFECTS: defects },
    stdio: ["ignore", "ignore", "pipe"],
  });
  for (let i = 0; i < 50; i += 1) {
    try { if ((await fetch(`${BASE}/login`)).ok) return child; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("서버가 뜨지 않음");
}

async function post(path, body, cookie) {
  return fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie } : {}) },
    body: new URLSearchParams(body).toString(),
    redirect: "manual",
  });
}

async function login() {
  const res = await post("/login", { email: "test@example.com", password: "Test1234!" });
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  return { location: res.headers.get("location"), cookie };
}

// 각 검사는 "정상판에서 참"이어야 하는 명제다.
const CHECKS = {
  "login-success-redirect": async () => (await login()).location === "/todos",
  "login-bad-password-error": async () => {
    const res = await post("/login", { email: "test@example.com", password: "nope" });
    return (await res.text()).includes("올바르지 않습니다");
  },
  "login-email-required": async () => (await (await fetch(`${BASE}/login`)).text()).includes("required"),
  "signup-redirect": async () => {
    const res = await post("/signup", { email: `new${Date.now()}@example.com`, password: "Pw1234!!" });
    return res.headers.get("location") === "/login";
  },
  "signup-duplicate-blocked": async () => {
    const res = await post("/signup", { email: "test@example.com", password: "Pw1234!!" });
    return (await res.text()).includes("이미 가입된 이메일");
  },
  "todo-add": async () => {
    const { cookie } = await login();
    await post("/todos/add", { title: "우유 사기" }, cookie);
    return (await (await fetch(`${BASE}/todos`, { headers: { cookie } })).text()).includes("우유 사기");
  },
  "todo-check": async () => {
    const { cookie } = await login();
    await post("/todos/add", { title: "우유" }, cookie);
    await post("/todos/toggle", { index: "0" }, cookie);
    return (await (await fetch(`${BASE}/todos`, { headers: { cookie } })).text()).includes("checked");
  },
  "todo-empty-state": async () => {
    const { cookie } = await login();
    return (await (await fetch(`${BASE}/todos`, { headers: { cookie } })).text()).includes("등록된 할 일이 없습니다");
  },
  "todo-filter-done": async () => {
    const { cookie } = await login();
    await post("/todos/add", { title: "미완료항목" }, cookie);
    const res = await fetch(`${BASE}/todos?filter=done`, { headers: { cookie } });
    return !(await res.text()).includes("미완료항목");
  },
  "todos-auth-guard": async () => {
    const res = await fetch(`${BASE}/todos`, { redirect: "manual" });
    return res.status === 303 && res.headers.get("location") === "/login";
  },
  "session-persist": async () => {
    const { cookie } = await login();
    const res = await fetch(`${BASE}/todos`, { headers: { cookie }, redirect: "manual" });
    return res.status === 200;
  },
  "logout-clears-session": async () => {
    const { cookie } = await login();
    await post("/logout", {}, cookie);
    const res = await fetch(`${BASE}/todos`, { headers: { cookie }, redirect: "manual" });
    return res.status === 303;
  },
};

const MAP = JSON.parse(await (await import("node:fs/promises")).readFile("eval/fixtures/todo-app/dods.json", "utf8"));
const brokenBy = Object.fromEntries(MAP.map((d) => [d.id, d.brokenBy]));

let failures = 0;

// 1) 정상판에서는 모든 검사가 참이어야 한다.
let child = await boot("none");
for (const [id, check] of Object.entries(CHECKS)) {
  const ok = await check();
  if (!ok) { console.log(`  ❌ 정상판인데 실패: ${id}`); failures += 1; }
}
child.kill("SIGTERM");
console.log("정상판 검사 완료");

// 2) 결함을 하나씩 켰을 때, 대응된 검사만 거짓이 되어야 한다.
for (const [id, defect] of Object.entries(brokenBy)) {
  if (!defect || !CHECKS[id]) continue;
  child = await boot(defect);
  const own = await CHECKS[id]();
  if (own) { console.log(`  ❌ ${defect} 를 켰는데 ${id} 가 여전히 통과`); failures += 1; }
  // 참고: 이 결함 아래에서 확인할 수 없게 되는 다른 완료조건들. 논리적
  // 의존성이며 실패가 아니다. 판정 러너는 결함을 하나씩만 켜므로 영향이 없다.
  const collateral = [];
  for (const [otherId, check] of Object.entries(CHECKS)) {
    if (otherId === id) continue;
    if (!(await check())) collateral.push(otherId);
  }
  if (collateral.length > 0) console.log(`  · ${defect}: ${collateral.join(", ")} 는 이 결함 아래에서 확인 불가(의존성)`);
  child.kill("SIGTERM");
}
console.log(failures === 0 ? "\n✅ 픽스처 자체 검증 통과: 정상판은 모두 만족, 각 결함은 대응된 조건을 실제로 깨뜨린다" : `\n❌ 채점 기준 문제 ${failures}건`);
process.exit(failures === 0 ? 0 : 1);
