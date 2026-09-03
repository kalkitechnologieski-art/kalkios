import { createClient } from "@/lib/supabase/client";

export async function auditLog(
  userId: string | undefined,
  action: string,
  provider: string,
  details: any
) {
  try {
    const supabase = createClient();
    await supabase.from("ai_audit_logs").insert({
      user_id: userId || null,
      action,
      provider,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export function notifyAdmin(error: Error, context: any) {
  console.error("[ADMIN ALERT]", error.message, context);
}
