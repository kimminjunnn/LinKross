import "server-only";

import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";
const REQUEST_TIMEOUT_MS = 10_000;
const ARCHIVE_REQUEST_TIMEOUT_MS = 60_000;
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;

type GitHubRequestAuth =
  | { type: "app" }
  | { type: "installation"; token: string };

export class GitHubAppError extends Error {
  readonly status?: number;
  readonly diagnosticCode?: string;
  readonly requestId?: string;

  constructor(message: string, status?: number, diagnosticCode?: string, requestId?: string) {
    super(message);
    this.name = "GitHubAppError";
    this.status = status;
    this.diagnosticCode = diagnosticCode;
    this.requestId = requestId;
  }
}

export interface GitHubRepository {
  id: number;
  html_url: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  archived: boolean;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  html_url: string;
  state: string;
  head: { ref: string; sha: string };
  base: { ref: string; repo: { id: number } };
}

export async function getGitHubAppInstallationUrl(): Promise<string> {
  const app = await githubRequest<{ html_url: string }>("/app", { type: "app" });
  return `${app.html_url.replace(/\/$/, "")}/installations/new`;
}

export async function getInstalledGitHubRepository(
  owner: string,
  repository: string,
): Promise<{ installationId: number; repository: GitHubRepository }> {
  const installation = await githubRequest<{ id: number }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/installation`,
    { type: "app" },
  );
  const token = await createInstallationAccessToken(installation.id);
  const repositoryData = await githubRequest<GitHubRepository>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
    { type: "installation", token },
  );

  return { installationId: installation.id, repository: repositoryData };
}

export async function getGitHubPullRequest(input: {
  installationId: number;
  repositoryId: number;
  owner: string;
  repository: string;
  pullRequestNumber: number;
}): Promise<GitHubPullRequest> {
  const context = {
    installationId: input.installationId,
    repositoryId: input.repositoryId,
    pullRequestNumber: input.pullRequestNumber,
  };
  const token = await runGitHubOperation(
    "installation_token",
    context,
    () => createInstallationAccessToken(input.installationId, [input.repositoryId]),
  );
  return runGitHubOperation(
    "pull_request_lookup",
    context,
    () => githubRequest<GitHubPullRequest>(
      `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/pulls/${input.pullRequestNumber}`,
      { type: "installation", token },
    ),
  );
}

export async function downloadGitHubRepositoryArchive(input: {
  installationId: number;
  repositoryId: number;
  owner: string;
  repository: string;
  commitSha: string;
}): Promise<{ archive: Uint8Array; sha256: string }> {
  if (!/^[0-9a-f]{40}$/i.test(input.commitSha)) {
    throw new GitHubAppError("검수할 Commit SHA 형식이 올바르지 않습니다.");
  }

  const token = await createInstallationAccessToken(input.installationId, [input.repositoryId]);
  const response = await githubFetch(
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repository)}/tarball/${input.commitSha}`,
    { type: "installation", token },
    { headers: { Accept: "application/vnd.github+json" } },
    ARCHIVE_REQUEST_TIMEOUT_MS,
  );
  if (!response.ok) throwGitHubResponseError(response.status);

  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ARCHIVE_BYTES) {
    throw new GitHubAppError("검수 저장소 archive가 허용 크기를 초과했습니다.", 413);
  }
  if (!response.body) {
    throw new GitHubAppError("검수 저장소 archive를 내려받지 못했습니다.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_ARCHIVE_BYTES) {
      await reader.cancel();
      throw new GitHubAppError("검수 저장소 archive가 허용 크기를 초과했습니다.", 413);
    }
    chunks.push(value);
  }

  const archive = Buffer.concat(chunks, totalBytes);
  return {
    archive,
    sha256: createHash("sha256").update(archive).digest("hex"),
  };
}

export function createGitHubAppJwt(now = new Date()): string {
  const appId = readGitHubAppId();
  const issuedAt = Math.floor(now.getTime() / 1000) - 60;
  const header = encodeBase64Url({ alg: "RS256", typ: "JWT" });
  const payload = encodeBase64Url({
    iat: issuedAt,
    exp: issuedAt + 9 * 60,
    iss: appId,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsignedToken), readGitHubAppPrivateKey());
  return `${unsignedToken}.${signature.toString("base64url")}`;
}

async function createInstallationAccessToken(
  installationId: number,
  repositoryIds?: number[],
): Promise<string> {
  if (!Number.isSafeInteger(installationId) || installationId <= 0) {
    throw new GitHubAppError("GitHub App 설치 정보가 올바르지 않습니다.");
  }

  const token = await githubRequest<{ token: string; expires_at: string }>(
    `/app/installations/${installationId}/access_tokens`,
    { type: "app" },
    {
      method: "POST",
      body: JSON.stringify({
        permissions: { contents: "read", pull_requests: "read" },
        ...(repositoryIds?.length ? { repository_ids: repositoryIds } : {}),
      }),
    },
  );

  // Installation Access Token은 호출 범위에서만 사용하고 DB나 로그에 남기지 않는다.
  return token.token;
}

async function githubRequest<T>(
  path: string,
  auth: GitHubRequestAuth,
  init: RequestInit = {},
): Promise<T> {
  const response = await githubFetch(path, auth, init, REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    throwGitHubResponseError(response.status, response.headers.get("x-github-request-id") ?? undefined);
  }

  return (await response.json()) as T;
}

async function githubFetch(
  path: string,
  auth: GitHubRequestAuth,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const authorization = auth.type === "app" ? createGitHubAppJwt() : auth.token;
  try {
    return await fetch(`${GITHUB_API_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${authorization}`,
        "Content-Type": "application/json",
        "User-Agent": "LinKross",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        ...init.headers,
      },
    });
  } catch {
    throw new GitHubAppError("GitHub 연결이 지연되고 있습니다. 다시 시도해주세요.");
  }
}

function throwGitHubResponseError(status: number, requestId?: string): never {
  const message =
    status === 404
      ? "GitHub App이 이 저장소에 설치되어 있지 않거나 저장소 접근 권한이 없습니다."
      : status === 401
        ? "GitHub App 인증 설정을 확인해주세요."
        : status === 403
          ? "GitHub App의 저장소 읽기 권한을 확인해주세요."
          : `GitHub 확인에 실패했습니다. (${status})`;
  throw new GitHubAppError(message, status, undefined, requestId);
}

async function runGitHubOperation<T>(
  stage: "installation_token" | "pull_request_lookup",
  context: Record<string, number>,
  operation: () => Promise<T>,
): Promise<T> {
  console.info("[github-app] operation started", { stage, ...context });
  try {
    const result = await operation();
    console.info("[github-app] operation completed", { stage, ...context });
    return result;
  } catch (error) {
    const status = error instanceof GitHubAppError ? error.status : undefined;
    const requestId = error instanceof GitHubAppError ? error.requestId : undefined;
    const diagnosticCode = `GH_${stage.toUpperCase()}_${status ?? "UNKNOWN"}`;

    console.error("[github-app] operation failed", {
      stage,
      diagnosticCode,
      status: status ?? null,
      githubRequestId: requestId ?? null,
      ...context,
    });

    const message = error instanceof GitHubAppError
      ? error.message
      : "GitHub 요청을 처리하지 못했습니다. 다시 시도해주세요.";
    throw new GitHubAppError(message, status, diagnosticCode, requestId);
  }
}

function readGitHubAppId(): string {
  const appId = process.env.GITHUB_APP_ID?.trim();
  if (!appId || !/^\d+$/.test(appId)) {
    throw new GitHubAppError("GitHub App ID 서버 설정이 필요합니다.");
  }
  return appId;
}

function readGitHubAppPrivateKey() {
  const encodedKey = process.env.GITHUB_APP_PRIVATE_KEY_BASE64?.trim();
  const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH?.trim();
  if (!encodedKey && !keyPath) {
    throw new GitHubAppError("GitHub App Private Key 서버 설정이 필요합니다.");
  }

  try {
    const pem = encodedKey
      ? Buffer.from(encodedKey, "base64").toString("utf8")
      : keyPath
        ? readFileSync(keyPath, "utf8")
        : "";
    if (!pem.includes("BEGIN") || !pem.includes("PRIVATE KEY")) {
      throw new Error("Invalid PEM");
    }
    return createPrivateKey(pem);
  } catch {
    throw new GitHubAppError("GitHub App Private Key 형식을 확인해주세요.");
  }
}

function encodeBase64Url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
