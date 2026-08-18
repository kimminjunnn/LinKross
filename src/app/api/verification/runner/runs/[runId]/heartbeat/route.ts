import { isAuthorizedRunner, readRunnerLease } from "@/lib/verification-runner/auth";
import { runnerErrorResponse, runnerJson } from "@/lib/verification-runner/http";
import { heartbeatVerificationJob } from "@/lib/verification-runner/service";

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
    const { runId } = await params;
    const result = await heartbeatVerificationJob(runId, lease);
    return runnerJson(result);
  } catch (error) {
    return runnerErrorResponse(error);
  }
}
