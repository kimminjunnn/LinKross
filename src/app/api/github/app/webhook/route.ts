import { NextRequest, NextResponse } from "next/server";

import { verifyGitHubWebhookSignature } from "@/lib/github/webhook";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 1_000_000;
const HEADER_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

interface GitHubWebhookPayload {
  action?: unknown;
  installation?: { id?: unknown };
  repository?: { id?: unknown };
  repositories_added?: Array<{ id?: unknown }>;
  repositories_removed?: Array<{ id?: unknown }>;
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ message: "Payload too large." }, { status: 413 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ message: "Payload too large." }, { status: 413 });
  }
  if (!verifyGitHubWebhookSignature(body, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  const deliveryId = request.headers.get("x-github-delivery") ?? "";
  const eventType = request.headers.get("x-github-event") ?? "";
  if (!HEADER_PATTERN.test(deliveryId) || !HEADER_PATTERN.test(eventType)) {
    return NextResponse.json({ message: "Invalid delivery headers." }, { status: 400 });
  }

  let payload: GitHubWebhookPayload;
  try {
    payload = JSON.parse(body) as GitHubWebhookPayload;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const installationId = readPositiveInteger(payload.installation?.id);
  const repositoryIds = collectRepositoryIds(payload);
  const action = typeof payload.action === "string" ? payload.action.slice(0, 100) : null;

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("github_webhook_deliveries").insert({
      delivery_id: deliveryId,
      event_type: eventType,
      action,
      installation_id: installationId,
      repository_ids: repositoryIds,
      processed_at: new Date().toISOString(),
    });

    if (error?.code === "23505") {
      return NextResponse.json({ accepted: true, duplicate: true }, { status: 202 });
    }
    if (error) {
      return NextResponse.json({ message: "Webhook persistence failed." }, { status: 500 });
    }
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch {
    return NextResponse.json({ message: "Webhook server is not configured." }, { status: 503 });
  }
}

function collectRepositoryIds(payload: GitHubWebhookPayload): number[] {
  const candidates = [
    payload.repository,
    ...(payload.repositories_added ?? []),
    ...(payload.repositories_removed ?? []),
  ];
  return Array.from(
    new Set(
      candidates
        .map((repository) => readPositiveInteger(repository?.id))
        .filter((id): id is number => id !== null),
    ),
  );
}

function readPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}
