// == KALKI B1 SPINE ==
// Idempotency keys for orders. Prevents double-charge on double-click.
// 5-minute sliding window: same user + same services within window = same key.
// -----------------------------------------------------------------------------

export function generateIdempotencyKey(
  userId: string,
  serviceIds: string[]
): string {
  const sorted = [...serviceIds].sort().join(',');
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
  return `${userId}:${sorted}:${bucket}`;
}

export function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash &= hash;
  }
  return Math.abs(hash).toString(36);
}

export function isValidIdempotencyKey(key: string): boolean {
  return typeof key === 'string' && key.length >= 10 && key.length <= 500;
}
