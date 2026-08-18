import { isAuthorizedRunner, readRunnerLease } from "@/lib/verification-runner/auth";
import { readBoundedJson, runnerErrorResponse, runnerJson } from "@/lib/verification-runner/http";
import { completeVerificationJob } from "@/lib/verification-runner/service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  if (!isAuthorizedRunner(request)) {
    return runnerJson({ message: "Unauthorized runner." }, { status: 401 });
  }
  const lease = readRunnerLease(request);
  if (!lease) return runnerJson({ message: "Valid runner lease headers are required." }, { status: 401 });

  try {
    const [{ runId }, body] = await Promise.all([params, readBoundedJson(request)]);
    const result = await completeVerificationJob(runId, lease, body);
    return runnerJson(result);
  } catch (error) {
    return runnerErrorResponse(error);
  }
}
