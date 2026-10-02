// == KALKI B3 COMMAND ==
// Audit helper — every sensitive admin action lands in `admin_actions`.
// -----------------------------------------------------------------------------

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface AdminActionPayload {
  action: string;
  targetTable?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}

export async function logAdminAction(args: AdminActionPayload): Promise<void> {
  try {
    const supabase = createClient() as unknown as {
      auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
      from: (t: string) => { insert: (row: unknown) => Promise<unknown> };
    };
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    await supabase.from('admin_actions').insert({
      actor_id: data.user.id,
      action: args.action,
      target_table: args.targetTable ?? null,
      target_id: args.targetId ?? null,
      payload: args.payload ?? {},
    });
  } catch (error) {
    logger.warn('[AdminActions] Failed to log', error);
  }
}
