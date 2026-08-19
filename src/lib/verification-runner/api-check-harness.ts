import "server-only";

export const MANAGED_API_CHECK_HARNESS = String.raw`
import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
const criteria = JSON.parse(await readFile(inputPath, "utf8"));
const outcomes = [];

for (const criterion of criteria) {
  const startedAt = Date.now();
  let status = "failed";
  let observedResult = "API 검증 시나리오가 예상 결과를 확인하지 못했습니다.";
  let errorMessage;

  try {
    const steps = criterion.testSpec.steps;
    let failedAt = -1;
    let failedStatus = null;

    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const response = await fetch("http://127.0.0.1:3000" + step.path, {
        method: step.method,
        headers: step.body ? { "Content-Type": "application/json" } : undefined,
        body: step.body ? JSON.stringify(step.body) : undefined,
        signal: AbortSignal.timeout(10000),
      });
      if (response.status !== step.expectStatus) {
        failedAt = i;
        failedStatus = response.status;
        break;
      }
    }

    if (failedAt === -1) {
      status = "passed";
      observedResult = "요청 " + steps.length + "건이 모두 예상된 상태 코드를 반환했습니다.";
    } else {
      status = "failed";
      observedResult =
        (failedAt + 1) + "번째 요청(" + steps[failedAt].method + " " + steps[failedAt].path + ")에서 " +
        steps[failedAt].expectStatus + " 상태 코드를 기대했지만 " + failedStatus + "을 받았습니다.";
    }
  } catch (error) {
    errorMessage = (error && error.message ? String(error.message) : "API 검증 요청이 실패했습니다.").slice(0, 1000);
  }

  outcomes.push({
    criterionId: criterion.criterionId,
    status,
    observedResult,
    ...(errorMessage ? { errorMessage } : {}),
    durationMs: Date.now() - startedAt,
  });
}

await writeFile(outputPath, JSON.stringify(outcomes), "utf8");
`;
