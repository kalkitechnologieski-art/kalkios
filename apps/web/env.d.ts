// ═══ SIDDHI v4.0 BATCH 3 ═══
// Environment variable types with feature flags.
// ─────────────────────────────────────────────────────────────────────────────

declare namespace NodeJS {
  interface ProcessEnv {
    // ─── Required ───
    AGNES_API_KEY: string;
    ZHIPU_API_KEY: string;
    GROQ_API_KEY: string;
    OPENROUTER_API_KEY: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // ─── Optional infrastructure ───
    REDIS_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_SITE_URL?: string;
    GOOGLE_SITE_VERIFICATION?: string;

    // ─── Payments ───
    INSTAMOJO_API_KEY?: string;
    INSTAMOJO_AUTH_TOKEN?: string;
    INSTAMOJO_PRIVATE_SALT?: string;
    INSTAMOJO_BASE_URL?: string;

    // ─── Search ───
    BRAVE_API_KEY?: string;
    SEARXNG_URL?: string;

    // ─── SIDDHI v4.0 feature flags ───
    SIDDHI_PIPELINE_V4?: string;
    SIDDHI_TOKEN_STREAMING?: string;
    SIDDHI_7PATH_REASONING?: string;
    SIDDHI_SELF_CRITIQUE?: string;
    SIDDHI_TOOLS?: string;
    SIDDHI_VISION?: string;
    SIDDHI_ARTIFACTS?: string;
    SIDDHI_PERSISTENT_MEMORY?: string;
    SIDDHI_VOICE?: string;
    SIDDHI_TELEMETRY?: string;
    SIDDHI_DEVICE_ENGINE?: string;
    SIDDHI_OMNIBUS_ROUTER?: string;
  }
}
