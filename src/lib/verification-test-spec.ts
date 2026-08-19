import type { VerificationMethod } from "@/lib/backend/contracts";

export const MANAGED_BROWSER_SPEC_VERSION = 1 as const;

export const MANAGED_BROWSER_PRESETS = [
  "login_fields",
  "login_success",
  "login_invalid_password",
  "login_email_required",
] as const;

export type ManagedBrowserPreset = (typeof MANAGED_BROWSER_PRESETS)[number];

export interface ManagedBrowserTestSpec {
  version: typeof MANAGED_BROWSER_SPEC_VERSION;
  kind: "managed_browser";
  preset: ManagedBrowserPreset;
  startPath: string;
  expectedPath?: string;
  syntheticCredentials: {
    email: string;
    password: string;
    invalidPassword: string;
  };
}

export const MANAGED_API_CHECK_SPEC_VERSION = 1 as const;
const MANAGED_API_CHECK_METHODS = ["GET", "POST"] as const;
const MAX_API_CHECK_STEPS = 10;

export interface ManagedApiCheckStep {
  method: (typeof MANAGED_API_CHECK_METHODS)[number];
  path: string;
  body?: Record<string, string>;
  expectStatus: number;
}

export interface ManagedApiCheckTestSpec {
  version: typeof MANAGED_API_CHECK_SPEC_VERSION;
  kind: "api_check";
  steps: ManagedApiCheckStep[];
}

export type ManagedTestSpec = ManagedBrowserTestSpec | ManagedApiCheckTestSpec;

const DEFAULT_CREDENTIALS = {
  email: "test@example.com",
  password: "Test1234!",
  invalidPassword: "wrong-password",
} as const;

export function createMvpVerificationDefinition(description: string): {
  verificationMethod: VerificationMethod;
  testSpec: ManagedTestSpec | Record<string, never>;
} {
  const preset = inferLoginPreset(description);
  if (preset) {
    return {
      verificationMethod: "automated_e2e",
      testSpec: {
        version: MANAGED_BROWSER_SPEC_VERSION,
        kind: "managed_browser",
        preset,
        startPath: "/login",
        ...(preset === "login_success" ? { expectedPath: "/dashboard" } : {}),
        syntheticCredentials: { ...DEFAULT_CREDENTIALS },
      },
    };
  }

  const apiCheckSteps = inferLoginLockoutSteps(description);
  if (apiCheckSteps) {
    return {
      verificationMethod: "automated_e2e",
      testSpec: { version: MANAGED_API_CHECK_SPEC_VERSION, kind: "api_check", steps: apiCheckSteps },
    };
  }

  return { verificationMethod: "manual", testSpec: {} };
}

const LOCKOUT_FAILED_ATTEMPTS = 5;

function inferLoginLockoutSteps(description: string): ManagedApiCheckStep[] | null {
  const normalized = description.toLowerCase().replace(/[`'"“”‘’]/g, "").replace(/\s+/g, " ").trim();
  const mentionsLoginFailure = /(로그인|login).*(실패|fail)|(실패|fail).*(로그인|login)/.test(normalized);
  const mentionsLockout = /잠금|잠기|차단|lock|429/.test(normalized);
  if (!mentionsLoginFailure || !mentionsLockout) return null;

  const steps: ManagedApiCheckStep[] = [];
  for (let attempt = 1; attempt <= LOCKOUT_FAILED_ATTEMPTS; attempt += 1) {
    steps.push({
      method: "POST",
      path: "/api/login",
      body: { email: DEFAULT_CREDENTIALS.email, password: `${DEFAULT_CREDENTIALS.invalidPassword}-${attempt}` },
      expectStatus: 401,
    });
  }
  steps.push({
    method: "POST",
    path: "/api/login",
    body: { email: DEFAULT_CREDENTIALS.email, password: `${DEFAULT_CREDENTIALS.invalidPassword}-lockout-check` },
    expectStatus: 429,
  });
  return steps;
}

export function resolveMvpVerificationDefinition(input: {
  description: string;
  verificationMethod: VerificationMethod;
  testSpec: unknown;
}): {
  verificationMethod: VerificationMethod;
  testSpec: ManagedTestSpec | null;
} {
  const storedApiSpec = parseManagedApiCheckTestSpec(input.testSpec);
  if (storedApiSpec) {
    return { verificationMethod: input.verificationMethod, testSpec: storedApiSpec };
  }

  const storedSpec = parseManagedBrowserTestSpec(input.testSpec);
  if (storedSpec) {
    return { verificationMethod: input.verificationMethod, testSpec: storedSpec };
  }

  const inferred = createMvpVerificationDefinition(input.description);
  const inferredSpec = parseManagedBrowserTestSpec(inferred.testSpec);
  if (inferred.verificationMethod === "automated_e2e" && inferredSpec) {
    return { verificationMethod: "automated_e2e", testSpec: inferredSpec };
  }
  return { verificationMethod: input.verificationMethod, testSpec: null };
}

export function parseManagedApiCheckTestSpec(value: unknown): ManagedApiCheckTestSpec | null {
  if (!isRecord(value)) return null;
  if (
    value.version !== MANAGED_API_CHECK_SPEC_VERSION ||
    value.kind !== "api_check" ||
    !Array.isArray(value.steps) ||
    value.steps.length === 0 ||
    value.steps.length > MAX_API_CHECK_STEPS
  ) {
    return null;
  }

  const steps: ManagedApiCheckStep[] = [];
  for (const rawStep of value.steps) {
    if (!isRecord(rawStep)) return null;
    if (!MANAGED_API_CHECK_METHODS.includes(rawStep.method as never)) return null;
    if (!isSafePath(rawStep.path)) return null;
    if (
      typeof rawStep.expectStatus !== "number" ||
      !Number.isInteger(rawStep.expectStatus) ||
      rawStep.expectStatus < 100 ||
      rawStep.expectStatus > 599
    ) {
      return null;
    }
    let body: Record<string, string> | undefined;
    if (rawStep.body !== undefined) {
      if (!isRecord(rawStep.body)) return null;
      body = {};
      for (const [key, val] of Object.entries(rawStep.body)) {
        const boundedKey = boundedText(key, 100);
        const boundedValue = boundedText(val, 500);
        if (!boundedKey || boundedValue === null) return null;
        body[boundedKey] = boundedValue;
      }
    }
    steps.push({
      method: rawStep.method as ManagedApiCheckStep["method"],
      path: rawStep.path,
      expectStatus: rawStep.expectStatus,
      ...(body ? { body } : {}),
    });
  }

  return { version: MANAGED_API_CHECK_SPEC_VERSION, kind: "api_check", steps };
}

export function parseManagedBrowserTestSpec(value: unknown): ManagedBrowserTestSpec | null {
  if (!isRecord(value)) return null;
  if (
    value.version !== MANAGED_BROWSER_SPEC_VERSION ||
    value.kind !== "managed_browser" ||
    !MANAGED_BROWSER_PRESETS.includes(value.preset as ManagedBrowserPreset) ||
    !isSafePath(value.startPath)
  ) {
    return null;
  }
  if (value.expectedPath !== undefined && !isSafePath(value.expectedPath)) return null;
  if (!isRecord(value.syntheticCredentials)) return null;

  const email = boundedText(value.syntheticCredentials.email, 254);
  const password = boundedText(value.syntheticCredentials.password, 200);
  const invalidPassword = boundedText(value.syntheticCredentials.invalidPassword, 200);
  if (!email || !password || !invalidPassword) return null;

  return {
    version: MANAGED_BROWSER_SPEC_VERSION,
    kind: "managed_browser",
    preset: value.preset as ManagedBrowserPreset,
    startPath: value.startPath,
    ...(typeof value.expectedPath === "string" ? { expectedPath: value.expectedPath } : {}),
    syntheticCredentials: { email, password, invalidPassword },
  };
}

function inferLoginPreset(description: string): ManagedBrowserPreset | null {
  const normalized = description.toLowerCase().replace(/[`'"“”‘’]/g, "").replace(/\s+/g, " ").trim();
  const mentionsEmail = /이메일|email/.test(normalized);
  const mentionsPassword = /비밀번호|password/.test(normalized);

  if (mentionsEmail && mentionsPassword && /입력|enter|fill|type/.test(normalized)) {
    return "login_fields";
  }
  if (/dashboard|대시보드/.test(normalized) && /로그인|login|sign in/.test(normalized)) {
    return "login_success";
  }
  if (mentionsPassword && /잘못|invalid|incorrect|wrong|오류|error/.test(normalized)) {
    return "login_invalid_password";
  }
  if (mentionsEmail && /미입력|비어|empty|required|누락|without/.test(normalized)) {
    return "login_email_required";
  }
  return null;
}

function isSafePath(value: unknown): value is string {
  return typeof value === "string" && /^\/(?!\/)[^\s?#]{0,500}$/.test(value);
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
