import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/security/api-guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'ai-consultants'), 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Consultants not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let query = supabase
      .from("AIConsultant")
      .select("*")
      .eq("isActive", true)
      .order("isFeatured", { ascending: false })
      .order("rating", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[AI Consultants] Query error:", error.message);
      return NextResponse.json({ error: 'Consultants lookup failed' }, { status: 500 });
    }

    return NextResponse.json(data || [], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[AI Consultants API] Error:", error);
    return NextResponse.json({ error: 'Consultants lookup failed' }, { status: 500 });
  }
}
