import "server-only";

export const MANAGED_PLAYWRIGHT_HARNESS = String.raw`
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "/vercel/sandbox/linkross-runner/node_modules/playwright/index.mjs";

const [inputPath, outputPath, evidenceDirectory] = process.argv.slice(2);
const criteria = JSON.parse(await readFile(inputPath, "utf8"));
await mkdir(evidenceDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const outcomes = [];

for (const criterion of criteria) {
  const startedAt = Date.now();
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3000", serviceWorkers: "block" });
  const page = await context.newPage();
  let status = "failed";
  let observedResult = "브라우저 시나리오가 예상 결과를 확인하지 못했습니다.";
  let errorMessage;
  const screenshotPath = evidenceDirectory + "/" + criterion.criterionId + ".png";

  try {
    await page.goto(criterion.testSpec.startPath, { waitUntil: "domcontentloaded", timeout: 15000 });
    const email = page.locator('input[type="email"],input[name="email"],input[autocomplete="username"]').first();
    const password = page.locator('input[type="password"],input[name="password"],input[autocomplete="current-password"]').first();
    const submit = page.locator('button[type="submit"],input[type="submit"],form button').first();
    const preset = criterion.testSpec.preset;
    const credentials = criterion.testSpec.syntheticCredentials;

    if (preset === "login_fields") {
      const passed = await email.isVisible() && await email.isEnabled()
        && await password.isVisible() && await password.isEnabled()
        && await submit.isVisible() && await submit.isEnabled();
      status = passed ? "passed" : "failed";
      observedResult = passed
        ? "이메일, 비밀번호 입력란과 로그인 제출 버튼을 실제 브라우저에서 확인했습니다."
        : "로그인 화면에서 이메일·비밀번호 입력란 또는 제출 버튼을 찾지 못했습니다.";
    } else if (preset === "login_success") {
      await email.fill(credentials.email);
      await password.fill(credentials.password);
      await submit.click();
      const expectedPath = criterion.testSpec.expectedPath || "/dashboard";
      await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 10000 });
      status = new URL(page.url()).pathname === expectedPath ? "passed" : "failed";
      observedResult = status === "passed"
        ? "정상 로그인 후 " + expectedPath + " 경로로 이동했습니다."
        : "정상 로그인을 시도했지만 " + expectedPath + " 경로 이동을 확인하지 못했습니다.";
    } else if (preset === "login_invalid_password") {
      await email.fill(credentials.email);
      await password.fill(credentials.invalidPassword);
      await submit.click();
      await page.waitForTimeout(500);
      const feedback = page.locator('[role="alert"],[aria-live="assertive"],[data-error],.error,.text-red-500,.text-red-600,.text-red-700').first();
      const bodyText = await page.locator("body").innerText();
      const blocked = new URL(page.url()).pathname === criterion.testSpec.startPath;
      const hasFeedback = await feedback.isVisible().catch(() => false)
        || await password.getAttribute("aria-invalid") === "true"
        || /invalid|incorrect|wrong|오류|실패|잘못/i.test(bodyText);
      status = blocked && hasFeedback ? "passed" : "failed";
      observedResult = status === "passed"
        ? "잘못된 비밀번호로 로그인이 차단되고 사용자에게 오류 피드백이 표시됐습니다."
        : "잘못된 비밀번호 입력 후 로그인 차단과 오류 피드백을 함께 확인하지 못했습니다.";
    } else {
      await password.fill(credentials.password);
      await submit.click();
      await page.waitForTimeout(300);
      const required = await email.evaluate((element) =>
        !element.checkValidity() || element.getAttribute("aria-invalid") === "true"
      );
      const blocked = new URL(page.url()).pathname === criterion.testSpec.startPath;
      status = blocked && required ? "passed" : "failed";
      observedResult = status === "passed"
        ? "이메일을 비운 상태에서 제출이 차단되는 것을 확인했습니다."
        : "이메일 미입력 시 제출 차단을 확인하지 못했습니다.";
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message.slice(0, 1000) : "브라우저 검수 명령이 실패했습니다.";
  }

  let hasScreenshot = false;
  try {
    await page.evaluate(() => {
      document.querySelectorAll("input,textarea").forEach((element) => {
        element.value = "";
        element.setAttribute("value", "");
      });
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        node.nodeValue = node.nodeValue.replace(
          /gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
          "[REDACTED]",
        );
      }
    });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    hasScreenshot = true;
  } catch {}

  await context.close();
  outcomes.push({
    criterionId: criterion.criterionId,
    status,
    observedResult,
    ...(errorMessage ? { errorMessage } : {}),
    durationMs: Date.now() - startedAt,
    ...(hasScreenshot ? { screenshotPath } : {}),
  });
}

await browser.close();
await writeFile(outputPath, JSON.stringify(outcomes), "utf8");
`;
