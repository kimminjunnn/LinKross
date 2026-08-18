import { isAuthorizedRunner, isValidRunnerId } from "@/lib/verification-runner/auth";
import { readBoundedJson, runnerErrorResponse, RunnerHttpError, runnerJson } from "@/lib/verification-runner/http";
import { claimVerificationJob } from "@/lib/verification-runner/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAuthorizedRunner(request)) {
    return runnerJson({ message: "Unauthorized runner." }, { status: 401 });
  }

  try {
    const body = await readBoundedJson(request);
    if (!body || typeof body !== "object" || !("workerId" in body) || !isValidRunnerId(body.workerId)) {
      throw new RunnerHttpError(400, "A valid workerId is required.");
    }
    const job = await claimVerificationJob(body.workerId);
    return runnerJson({ job });
  } catch (error) {
    return runnerErrorResponse(error);
  }
}
