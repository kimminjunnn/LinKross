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

const DEFAULT_CREDENTIALS = {
  email: "test@example.com",
  password: "Test1234!",
  invalidPassword: "wrong-password",
} as const;

export function createMvpVerificationDefinition(description: string): {
  verificationMethod: VerificationMethod;
  testSpec: ManagedBrowserTestSpec | Record<string, never>;
} {
  const preset = inferLoginPreset(description);
  if (!preset) return { verificationMethod: "manual", testSpec: {} };

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

export function resolveMvpVerificationDefinition(input: {
  description: string;
  verificationMethod: VerificationMethod;
  testSpec: unknown;
}): {
  verificationMethod: VerificationMethod;
  testSpec: ManagedBrowserTestSpec | null;
} {
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
