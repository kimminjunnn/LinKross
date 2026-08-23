/**
 * `.env.local`을 프리로드한다.
 *
 * ESM import는 호이스팅되므로, 평가 스크립트 본문에서 환경변수를 읽으면
 * 이미 최상위에서 `GEMINI_API_KEY`를 읽는 코드가 실행된 뒤다. `--import`로 이 모듈을 먼저 올려야 키가 제때 준비된다.
 */

import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), ".env.local");
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = (match[2] ?? "").trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}
