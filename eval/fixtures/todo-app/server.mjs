/**
 * 판정 정확도 측정용 픽스처 앱 (C단계).
 *
 * 검수가 "잘 되는지"를 증명하려면 두 가지를 동시에 확인해야 한다.
 *   - 정상 동작하는 앱을 실패로 판정하지 않는가 (False FAIL)
 *   - 고장난 앱을 통과로 판정하지 않는가 (False PASS)
 *
 * 그래서 같은 앱을 정상판과 고장판 두 벌로 돌린다. 두 벌을 별도 파일로 두면
 * 한쪽만 고쳐져 서로 다른 앱이 되어 버리므로, 결함을 환경변수 플래그로 켜는
 * 한 벌로 유지한다. `DEFECTS=all`이면 아래 표의 결함이 모두 켜진다.
 *
 * 결함과 완료조건의 대응은 `dods.json`의 `brokenBy`에 있으며, 그 표가 곧 채점
 * 기준이다. 결함이 대응되지 않은 완료조건은 대조군이며 두 판 모두 통과해야 한다.
 *
 * 실행: PORT=3100 DEFECTS=none node eval/fixtures/todo-app/server.mjs
 *
 * 의존성 없이 표준 라이브러리만 쓴다. 검수 대상 앱을 흉내내는 것이 목적이므로
 * 프레임워크나 빌드 단계를 두지 않는다.
 */

import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 3100);

export const DEFECT_NAMES = [
  /** 비밀번호가 틀려도 오류 문구를 보여주지 않는다. */
  "no_error_on_bad_password",
  /** 이메일이 비어도 제출을 막지 않는다. */
  "allow_empty_email",
  /** 로그인 성공 후 /todos 가 아닌 곳으로 보낸다. */
  "wrong_redirect",
  /** 할 일을 추가해도 목록에 반영되지 않는다. */
  "todo_not_added",
  /** 체크박스를 눌러도 선택 상태가 되지 않는다. */
  "checkbox_not_checked",
  /** 비로그인 상태에서도 /todos 를 열어 준다. */
  "no_auth_guard",
  /** 재접속하면 세션이 풀린다. */
  "session_lost",
  /** 회원가입에 성공해도 /login 으로 보내지 않는다. */
  "signup_no_redirect",
  /** 이미 가입된 이메일로 다시 가입해도 막지 않는다. */
  "signup_allows_duplicate",
  /** 완료 필터를 눌러도 완료되지 않은 항목까지 보여준다. */
  "filter_shows_all",
  /** 로그아웃해도 세션이 남는다. */
  "logout_keeps_session",
  /** 할 일이 없어도 빈 상태 안내를 보여주지 않는다. */
  "empty_state_missing",
];

const requested = (process.env.DEFECTS ?? "none").trim();
const DEFECTS = new Set(
  requested === "all" ? DEFECT_NAMES : requested === "none" || requested === "" ? [] : requested.split(","),
);
for (const name of DEFECTS) {
  if (!DEFECT_NAMES.includes(name)) throw new Error(`알 수 없는 결함 이름: ${name}`);
}

const SEED_EMAIL = "test@example.com";
const SEED_PASSWORD = "Test1234!";

/** 이메일 → 비밀번호. 프로세스 메모리에만 둔다. */
const accounts = new Map([[SEED_EMAIL, SEED_PASSWORD]]);
/** 세션토큰 → { email, todos }. */
const sessions = new Map();

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = readCookie(request, "sid");
  const session = token ? sessions.get(token) : undefined;

  if (request.method === "POST") return handlePost(request, response, url, session, token);

  switch (url.pathname) {
    case "/":
      return html(response, page("홈", `<h1>할 일 관리</h1><p><a href="/login">로그인</a> · <a href="/signup">회원가입</a></p>`));
    case "/signup":
      return html(response, signupPage(url.searchParams.get("error")));
    case "/login":
      return html(response, loginPage(url.searchParams.get("error")));
    case "/todos": {
      if (!session && !DEFECTS.has("no_auth_guard")) return redirect(response, "/login");
      if (session && DEFECTS.has("session_lost")) {
        sessions.delete(token);
        return redirect(response, "/login");
      }
      const onlyDone = url.searchParams.get("filter") === "done";
      return html(response, todosPage(session?.todos ?? [], onlyDone));
    }
    default:
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      return response.end(page("없음", "<h1>페이지를 찾을 수 없습니다</h1>"));
  }
});

function handlePost(request, response, url, session, token) {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
    if (body.length > 10_000) request.destroy();
  });
  request.on("end", () => {
    const form = new URLSearchParams(body);

    if (url.pathname === "/signup") {
      const email = (form.get("email") ?? "").trim();
      const password = form.get("password") ?? "";
      if (!email || !password) return html(response, signupPage("이메일과 비밀번호를 입력해 주세요."));
      if (accounts.has(email) && !DEFECTS.has("signup_allows_duplicate")) {
        return html(response, signupPage("이미 가입된 이메일입니다."));
      }
      // 결함은 "중복을 막지 않는다"까지다. 기존 계정의 비밀번호까지 덮어쓰면
      // 그 뒤의 모든 로그인이 깨져 무관한 완료조건까지 실패한다. 결함 하나가
      // 대응된 완료조건만 깨뜨려야 채점 기준이 성립한다.
      if (!accounts.has(email)) accounts.set(email, password);
      return redirect(response, DEFECTS.has("signup_no_redirect") ? "/signup" : "/login");
    }

    if (url.pathname === "/login") {
      const email = (form.get("email") ?? "").trim();
      const password = form.get("password") ?? "";

      if (!email && !DEFECTS.has("allow_empty_email")) {
        return html(response, loginPage("이메일을 입력해 주세요."));
      }
      if (accounts.get(email) !== password) {
        return html(
          response,
          loginPage(DEFECTS.has("no_error_on_bad_password") ? null : "이메일 또는 비밀번호가 올바르지 않습니다."),
        );
      }

      const newToken = randomUUID();
      sessions.set(newToken, { email, todos: [] });
      response.setHeader("set-cookie", `sid=${newToken}; Path=/; HttpOnly`);
      return redirect(response, DEFECTS.has("wrong_redirect") ? "/" : "/todos");
    }

    if (url.pathname === "/logout") {
      if (token && !DEFECTS.has("logout_keeps_session")) sessions.delete(token);
      return redirect(response, "/login");
    }

    if (url.pathname === "/todos/add") {
      if (!session) return redirect(response, "/login");
      const title = (form.get("title") ?? "").trim();
      if (title && !DEFECTS.has("todo_not_added")) session.todos.push({ title, done: false });
      return redirect(response, "/todos");
    }

    if (url.pathname === "/todos/toggle") {
      if (!session) return redirect(response, "/login");
      const todo = session.todos[Number(form.get("index"))];
      if (todo && !DEFECTS.has("checkbox_not_checked")) todo.done = !todo.done;
      return redirect(response, "/todos");
    }

    return redirect(response, "/");
  });
}

function signupPage(error) {
  return page(
    "회원가입",
    `
    <h1>회원가입</h1>
    <form method="post" action="/signup">
      <label for="email">이메일</label>
      <input id="email" name="email" type="email" autocomplete="username" required />
      <label for="password">비밀번호</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required />
      <button type="submit">가입하기</button>
    </form>
    ${error ? `<p role="alert" class="error">${escapeHtml(error)}</p>` : ""}
    <p><a href="/login">로그인</a></p>
  `,
  );
}

function loginPage(error) {
  // required 속성이 있어야 브라우저가 빈 값 제출을 막는다. 결함을 켜면 뗀다.
  const required = DEFECTS.has("allow_empty_email") ? "" : "required";
  return page(
    "로그인",
    `
    <h1>로그인</h1>
    <form method="post" action="/login">
      <label for="email">이메일</label>
      <input id="email" name="email" type="email" autocomplete="username" ${required} />
      <label for="password">비밀번호</label>
      <input id="password" name="password" type="password" autocomplete="current-password" />
      <button type="submit">로그인</button>
    </form>
    ${error ? `<p role="alert" class="error">${escapeHtml(error)}</p>` : ""}
    <p><a href="/signup">회원가입</a></p>
  `,
  );
}

function todosPage(todos, onlyDone) {
  // 완료 필터: 결함을 켜면 거르지 않고 전부 보여준다.
  const visible =
    onlyDone && !DEFECTS.has("filter_shows_all")
      ? todos.map((todo, index) => ({ todo, index })).filter((entry) => entry.todo.done)
      : todos.map((todo, index) => ({ todo, index }));

  const items = visible
    .map(
      ({ todo, index }) => `
      <li>
        <form method="post" action="/todos/toggle" class="inline">
          <input type="hidden" name="index" value="${index}" />
          <input type="checkbox" id="todo-${index}" ${todo.done ? "checked" : ""}
                 onchange="this.form.submit()" />
          <label for="todo-${index}">${escapeHtml(todo.title)}${todo.done ? " (완료)" : ""}</label>
        </form>
      </li>`,
    )
    .join("");

  const emptyNotice =
    visible.length === 0 && !DEFECTS.has("empty_state_missing") ? `<p>등록된 할 일이 없습니다.</p>` : "";

  return page(
    "할 일",
    `
    <h1>할 일 목록</h1>
    <form method="post" action="/logout" class="inline">
      <button type="submit">로그아웃</button>
    </form>
    <form method="post" action="/todos/add">
      <label for="title">할 일</label>
      <input id="title" name="title" type="text" />
      <button type="submit">할 일 추가</button>
    </form>
    <p><a href="/todos">전체</a> · <a href="/todos?filter=done">완료</a></p>
    ${emptyNotice}
    ${visible.length > 0 ? `<ul>${items}</ul>` : ""}
  `,
  );
}

function page(title, body) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
 body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}
 label{display:block;margin-top:.75rem}
 input[type=email],input[type=password],input[type=text]{display:block;width:100%;padding:.5rem}
 button{margin-top:1rem;padding:.5rem 1rem}
 .error{color:#b00020}
 .inline{display:flex;align-items:center;gap:.5rem}
 .inline label{margin:0}
 .inline input[type=checkbox]{width:auto}
 ul{list-style:none;padding:0}
</style></head><body>${body}</body></html>`;
}

function redirect(response, location) {
  response.writeHead(303, { location });
  response.end();
}

function html(response, body) {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(body);
}

function readCookie(request, name) {
  const header = request.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const [key, value] = part.trim().split("=");
    if (key === name) return value;
  }
  return undefined;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}

server.listen(PORT, "127.0.0.1", () => {
  const enabled = DEFECTS.size === 0 ? "없음(정상판)" : [...DEFECTS].join(",");
  console.log(`픽스처 앱 http://127.0.0.1:${PORT} · 결함: ${enabled}`);
});
