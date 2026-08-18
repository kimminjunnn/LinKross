import { isAuthorizedRunner, isValidRunnerId } from "@/lib/verification-runner/auth";
import { readBoundedJson, runnerErrorResponse, RunnerHttpError, runnerJson } from "@/lib/verification-runner/http";
import { executeNextVerificationInVercelSandbox } from "@/lib/verification-runner/vercel-sandbox";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST(request: Request) {
  if (!isAuthorizedRunner(request)) {
    return runnerJson({ message: "Unauthorized runner." }, { status: 401 });
  }

  try {
    const body = await readBoundedJson(request);
    if (!body || typeof body !== "object" || !("workerId" in body) || !isValidRunnerId(body.workerId)) {
      throw new RunnerHttpError(400, "A valid workerId is required.");
    }
    const result = await executeNextVerificationInVercelSandbox(body.workerId);
    return runnerJson(result);
  } catch (error) {
    return runnerErrorResponse(error);
  }
}
