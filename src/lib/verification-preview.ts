export const VERIFICATION_PREVIEW_DURATION_MS = 10 * 60 * 1_000;

export function getVerificationPreviewRemainingMs(
  previewExpiresAt: string | null,
  nowMs: number,
): number {
  if (!previewExpiresAt) return 0;
  const expiresAtMs = Date.parse(previewExpiresAt);
  if (!Number.isFinite(expiresAtMs)) return 0;
  return Math.max(0, expiresAtMs - nowMs);
}
