// == KALKI B2 ENGINES ==
// Batch payout processor. Groups by user, marks rewards as paid, logs batch.
// -----------------------------------------------------------------------------

export interface PendingReward {
  id: string;
  user_id: string;
  amount: number;
}

export interface PayoutBatch {
  batch_number: string;
  items: Array<{ user_id: string; amount: number; reward_ids: string[] }>;
  total_amount: number;
  total_users: number;
}

export function buildPayoutBatch(rewards: PendingReward[]): PayoutBatch {
  const byUser = new Map<string, { amount: number; ids: string[] }>();

  for (const r of rewards) {
    const existing = byUser.get(r.user_id);
    if (existing) {
      existing.amount += r.amount;
      existing.ids.push(r.id);
    } else {
      byUser.set(r.user_id, { amount: r.amount, ids: [r.id] });
    }
  }

  const items = Array.from(byUser.entries()).map(([user_id, { amount, ids }]) => ({
    user_id,
    amount: Math.round(amount * 100) / 100,
    reward_ids: ids,
  }));

  const total_amount = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;

  return {
    batch_number: `PAY-${Date.now().toString(36).toUpperCase()}`,
    items,
    total_amount,
    total_users: items.length,
  };
}

export function filterByMinimum(rewards: PendingReward[], min: number): PendingReward[] {
  const byUser = new Map<string, number>();
  for (const r of rewards) {
    byUser.set(r.user_id, (byUser.get(r.user_id) ?? 0) + r.amount);
  }
  const eligibleUsers = new Set(
    Array.from(byUser.entries()).filter(([, amt]) => amt >= min).map(([id]) => id)
  );
  return rewards.filter((r) => eligibleUsers.has(r.user_id));
}

export function formatPayoutCsv(batch: PayoutBatch): string {
  const headers = ['User ID', 'Amount', 'Reward Count', 'Batch'];
  const rows = batch.items.map((i) => [
    i.user_id,
    i.amount.toFixed(2),
    i.reward_ids.length.toString(),
    batch.batch_number,
  ]);
  const bom = '\uFEFF';
  return bom + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
}
