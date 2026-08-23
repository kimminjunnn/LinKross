// node --test 가 `@/` 경로 별칭을 해석하도록 돕는 로더 훅.
// tsconfig.json 의 paths 설정과 같은 규칙을 따른다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = path.join(ROOT, "src", specifier.slice(2));
    // 확장자가 이미 붙은 경로(`@/data/rag-glossary.json`)와 `.json`을 함께 본다.
    // `@/lib/rag-translator`가 용어집을 JSON으로 가져오는데, 후보에 없으면
    // 그 모듈을 쓰는 스크립트가 전부 로드에 실패한다.
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, "index.ts")]) {
      // 디렉터리는 건너뛴다. `@/lib/sow-presets`처럼 이름이 겹치면 디렉터리가
      // 먼저 잡혀 `index.ts` 후보까지 가지 못한다.
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        if (candidate.endsWith(".json")) {
          // 해석 결과에도 속성을 실어 보내야 로드 단계가 JSON으로 읽는다.
          const resolved = await next(pathToFileURL(candidate).href, {
            ...context,
            importAttributes: { type: "json" },
          });
          return { ...resolved, format: "json", importAttributes: { type: "json" } };
        }
        return next(pathToFileURL(candidate).href, context);
      }
    }
  }
  return next(specifier, context);
}
