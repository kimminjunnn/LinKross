export const VERIFICATION_PREVIEW_DURATION_MS = 5 * 60 * 1_000;

export function getVerificationPreviewRemainingMs(
  previewExpiresAt: string | null,
  nowMs: number,
): number {
  if (!previewExpiresAt) return 0;
  const expiresAtMs = Date.parse(previewExpiresAt);
  if (!Number.isFinite(expiresAtMs)) return 0;
  return Math.max(0, expiresAtMs - nowMs);
}

export function formatVerificationPreviewRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
