import "server-only";

export const MANAGED_PLAYWRIGHT_HARNESS = String.raw`
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "/vercel/sandbox/linkross-runner/node_modules/playwright/index.mjs";

const [inputPath, outputPath, evidenceDirectory] = process.argv.slice(2);
const criteria = JSON.parse(await readFile(inputPath, "utf8"));
await mkdir(evidenceDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const outcomes = [];

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

const SEMANTIC_FIELD_SELECTORS = {
  email: 'input[type="email"],input[name="email"],input[autocomplete="username"]',
  password: 'input[type="password"],input[name="password"],input[autocomplete="current-password"]',
  submit: 'button[type="submit"],input[type="submit"],form button',
};

function resolveTargetAll(page, target) {
  if (target.field) return page.locator(SEMANTIC_FIELD_SELECTORS[target.field]);
  if (target.role) {
    return target.name ? page.getByRole(target.role, { name: target.name }) : page.getByRole(target.role);
  }
  if (target.label) return page.getByLabel(target.label);
  if (target.text) return page.getByText(target.text);
  if (target.placeholder) return page.getByPlaceholder(target.placeholder);
  if (target.testId) return page.getByTestId(target.testId);
  throw new Error("Unsupported target descriptor.");
}

function resolveTarget(page, target) {
  return resolveTargetAll(page, target).first();
}

function describeTarget(target) {
  if (target.field === "email") return "이메일 입력란";
  if (target.field === "password") return "비밀번호 입력란";
  if (target.field === "submit") return "제출 버튼";
  if (target.role) return target.name ? target.role + ' "' + target.name + '"' : target.role + " 요소";
  if (target.label) return '"' + target.label + '" 라벨 요소';
  if (target.text) return '"' + target.text + '" 문구 요소';
  if (target.placeholder) return '"' + target.placeholder + '" 입력란';
  if (target.testId) return "테스트 ID " + target.testId + " 요소";
  return "대상 요소";
}

function describeAtom(step) {
  switch (step.atom) {
    case "goto": return step.path + " 경로 열기";
    case "fill": return describeTarget(step.target) + "에 값 입력";
    case "select_option": return describeTarget(step.target) + '에서 "' + (step.value.literal ?? "값") + '" 선택';
    case "click": return describeTarget(step.target) + " 클릭";
    case "press": return step.key + " 키 입력";
    case "set_viewport": return step.preset + " 화면 크기로 전환";
    case "expect_visible": return describeTarget(step.target) + "이 화면에 표시됨";
    case "expect_hidden": return describeTarget(step.target) + "이 화면에 표시되지 않음";
    case "expect_enabled": return describeTarget(step.target) + "이 사용 가능함";
    case "expect_disabled": return describeTarget(step.target) + "이 비활성화됨";
    case "expect_focused": return describeTarget(step.target) + "에 키보드 포커스가 있음";
    case "expect_text": return '"' + step.contains + '" 문구가 표시됨';
    case "expect_path": return step.path + " 경로에 머무름 또는 이동";
    case "expect_within_viewport": return describeTarget(step.target) + "이 화면 안에 온전히 보임";
    case "expect_error_feedback": return "사용자에게 오류 피드백이 표시됨";
    case "expect_form_blocked": return describeTarget(step.target) + " 검증으로 제출이 차단됨";
    case "expect_checked": return describeTarget(step.target) + "이 선택된 상태임";
    case "expect_unchecked": return describeTarget(step.target) + "이 선택되지 않은 상태임";
    case "expect_count": return describeTarget(step.target) + "이 정확히 " + step.count + "개 표시됨";
    case "expect_every_text": return "표시된 모든 " + describeTarget(step.target) + '에 "' + step.contains + '" 문구가 있음';
    case "expect_none_text": return "표시된 어떤 " + describeTarget(step.target) + '에도 "' + step.contains + '" 문구가 없음';
    default: return "알 수 없는 동작";
  }
}

function stepFailure(step, message) {
  const error = new Error(message);
  error.linkrossStep = describeAtom(step);
  return error;
}

async function runAtom(page, step, credentials) {
  switch (step.atom) {
    case "goto":
      await page.goto(step.path, { waitUntil: "domcontentloaded", timeout: 15000 });
      return;
    case "fill": {
      const value = step.value.ref ? credentials[step.value.ref] : step.value.literal;
      await resolveTarget(page, step.target).fill(value, { timeout: 10000 });
      return;
    }
    case "select_option": {
      const value = step.value.ref ? credentials[step.value.ref] : step.value.literal;
      const locator = resolveTarget(page, step.target);
      // 완료조건은 화면에 보이는 문구로 쓰이므로 표시 문구를 먼저 찾는다.
      // 옵션 라벨과 value 가 다른 화면(예: 이름은 보이고 값은 id)을 위해 value 로도 한 번 더 시도한다.
      try {
        await locator.selectOption({ label: value }, { timeout: 10000 });
      } catch {
        await locator.selectOption(value, { timeout: 10000 });
      }
      await page.waitForTimeout(200);
      return;
    }
    case "click":
      await resolveTarget(page, step.target).click({ timeout: 10000 });
      await page.waitForTimeout(400);
      return;
    case "press":
      await page.keyboard.press(step.key);
      await page.waitForTimeout(150);
      return;
    case "set_viewport":
      await page.setViewportSize(VIEWPORTS[step.preset]);
      await page.waitForTimeout(150);
      return;
    case "expect_visible": {
      const visible = await resolveTarget(page, step.target).isVisible().catch(() => false);
      if (!visible) throw stepFailure(step, describeTarget(step.target) + "을 화면에서 찾지 못했습니다.");
      return;
    }
    case "expect_hidden": {
      const visible = await resolveTarget(page, step.target).isVisible().catch(() => false);
      if (visible) throw stepFailure(step, describeTarget(step.target) + "이 화면에 그대로 표시되고 있습니다.");
      return;
    }
    case "expect_enabled": {
      const enabled = await resolveTarget(page, step.target).isEnabled().catch(() => false);
      if (!enabled) throw stepFailure(step, describeTarget(step.target) + "이 사용 가능한 상태가 아닙니다.");
      return;
    }
    case "expect_disabled": {
      const enabled = await resolveTarget(page, step.target).isEnabled().catch(() => true);
      if (enabled) throw stepFailure(step, describeTarget(step.target) + "이 비활성화되어 있지 않습니다.");
      return;
    }
    case "expect_focused": {
      const focused = await resolveTarget(page, step.target)
        .evaluate((element) => element === document.activeElement)
        .catch(() => false);
      if (!focused) throw stepFailure(step, describeTarget(step.target) + "이 키보드 포커스를 받지 못했습니다.");
      return;
    }
    case "expect_text": {
      const scope = step.target ? resolveTarget(page, step.target) : page.locator("body");
      const text = await scope.innerText().catch(() => "");
      if (!text.includes(step.contains)) {
        throw stepFailure(step, '"' + step.contains + '" 문구를 화면에서 찾지 못했습니다.');
      }
      return;
    }
    case "expect_path": {
      try {
        await page.waitForURL((url) => url.pathname === step.path, { timeout: 10000 });
      } catch {
        throw stepFailure(
          step,
          "기대한 경로는 " + step.path + "이지만 실제 경로는 " + new URL(page.url()).pathname + "입니다.",
        );
      }
      return;
    }
    case "expect_within_viewport": {
      const box = await resolveTarget(page, step.target).boundingBox().catch(() => null);
      const size = page.viewportSize();
      if (!box || !size) throw stepFailure(step, describeTarget(step.target) + "의 화면상 위치를 확인하지 못했습니다.");
      const within = box.width > 0 && box.height > 0 && box.x >= 0 && box.x + box.width <= size.width + 1;
      if (!within) {
        throw stepFailure(step, describeTarget(step.target) + "이 화면 가로 범위를 벗어나 잘려 보입니다.");
      }
      return;
    }
    case "expect_error_feedback": {
      const feedback = page
        .locator('[role="alert"],[aria-live="assertive"],[data-error],.error,.text-red-500,.text-red-600,.text-red-700')
        .first();
      const bodyText = await page.locator("body").innerText().catch(() => "");
      const hasFeedback =
        (await feedback.isVisible().catch(() => false)) ||
        (await page.locator('[aria-invalid="true"]').first().isVisible().catch(() => false)) ||
        /invalid|incorrect|wrong|오류|실패|잘못/i.test(bodyText);
      if (!hasFeedback) throw stepFailure(step, "사용자에게 표시되는 오류 피드백을 찾지 못했습니다.");
      return;
    }
    case "expect_form_blocked": {
      const blocked = await resolveTarget(page, step.target)
        .evaluate((element) => {
          const invalid = typeof element.checkValidity === "function" ? !element.checkValidity() : false;
          return invalid || element.getAttribute("aria-invalid") === "true";
        })
        .catch(() => false);
      if (!blocked) throw stepFailure(step, "입력값 검증으로 제출이 차단되는 것을 확인하지 못했습니다.");
      return;
    }
    case "expect_checked": {
      const checked = await resolveTarget(page, step.target).isChecked().catch(() => false);
      if (!checked) throw stepFailure(step, describeTarget(step.target) + "이 선택된 상태가 아닙니다.");
      return;
    }
    case "expect_unchecked": {
      const checked = await resolveTarget(page, step.target).isChecked().catch(() => true);
      if (checked) throw stepFailure(step, describeTarget(step.target) + "이 선택된 상태로 남아 있습니다.");
      return;
    }
    case "expect_count": {
      const actual = await resolveTargetAll(page, step.target).count().catch(() => -1);
      if (actual !== step.count) {
        throw stepFailure(
          step,
          describeTarget(step.target) + "이 " + step.count + "개여야 하는데 " +
            (actual < 0 ? "개수를 확인하지 못했습니다" : actual + "개입니다") + ".",
        );
      }
      return;
    }
    case "expect_every_text":
    case "expect_none_text": {
      const texts = await resolveTargetAll(page, step.target).allInnerTexts().catch(() => []);
      // 대상이 하나도 없으면 "모두 그렇다"도 "아무것도 아니다"도 증명되지 않는다.
      // 빈 화면을 통과로 처리하면 목록이 깨진 앱이 통과해 버린다.
      if (texts.length === 0) {
        throw stepFailure(step, describeTarget(step.target) + "을 화면에서 찾지 못해 목록 내용을 확인할 수 없습니다.");
      }
      const index = step.atom === "expect_every_text"
        ? texts.findIndex((text) => !text.includes(step.contains))
        : texts.findIndex((text) => text.includes(step.contains));
      if (index >= 0) {
        throw stepFailure(
          step,
          (index + 1) + "번째 " + describeTarget(step.target) + '에 "' + step.contains + '" 문구가 ' +
            (step.atom === "expect_every_text" ? "없습니다." : "남아 있습니다.") +
            " (전체 " + texts.length + "개)",
        );
      }
      return;
    }
    default:
      throw stepFailure(step, "지원하지 않는 검수 동작입니다.");
  }
}

for (const criterion of criteria) {
  const startedAt = Date.now();
  const spec = criterion.testSpec;
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3000",
    serviceWorkers: "block",
    viewport: VIEWPORTS.desktop,
  });
  const page = await context.newPage();
  let status = "failed";
  let observedResult = "브라우저 시나리오가 예상 결과를 확인하지 못했습니다.";
  let errorMessage;
  const screenshotPath = evidenceDirectory + "/" + criterion.criterionId + ".png";
  const completed = [];

  try {
    await page.goto(spec.startPath, { waitUntil: "domcontentloaded", timeout: 15000 });
    for (const step of spec.steps) {
      await runAtom(page, step, spec.syntheticCredentials);
      completed.push(describeAtom(step));
    }
    status = "passed";
    observedResult = "실제 브라우저에서 확인했습니다: " + completed.join(" → ") + ".";
  } catch (error) {
    const failedStep = error && error.linkrossStep ? error.linkrossStep : null;
    const detail = error instanceof Error ? error.message.slice(0, 1000) : "브라우저 검수 명령이 실패했습니다.";
    observedResult = failedStep
      ? (completed.length > 0 ? "확인한 동작: " + completed.join(" → ") + ". " : "") +
        "다음 단계에서 기대한 결과를 확인하지 못했습니다: " + failedStep + "."
      : "브라우저 시나리오 실행 중 오류가 발생했습니다.";
    errorMessage = detail;
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
