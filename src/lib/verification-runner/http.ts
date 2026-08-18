import "server-only";

const MAX_JSON_BYTES = 256_000;

export async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    throw new RunnerHttpError(413, "Payload too large.");
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_JSON_BYTES) {
    throw new RunnerHttpError(413, "Payload too large.");
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RunnerHttpError(400, "Invalid JSON payload.");
  }
}

export function runnerJson(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return Response.json(body, { ...init, headers });
}

export class RunnerHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RunnerHttpError";
  }
}

export function runnerErrorResponse(error: unknown): Response {
  if (error instanceof RunnerHttpError) {
    return runnerJson({ message: error.message }, { status: error.status });
  }
  return runnerJson({ message: "Runner control plane request failed." }, { status: 500 });
}
