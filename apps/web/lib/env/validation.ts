/**
 * Environment variable validation
 * Ensures all required keys are present before making API calls
 */

export interface EnvStatus {
  valid: boolean;
  missing: string[];
  present: string[];
}

const REQUIRED_KEYS = [
  "AGNES_API_KEY",
  "ZHIPU_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
];

const OPTIONAL_KEYS = [
  "REDIS_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export function validateEnv(): EnvStatus {
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of REQUIRED_KEYS) {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_KEYS) {
    if (process.env[key]) {
      present.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

export function getEnvStatusMessage(): string {
  const status = validateEnv();
  if (status.valid) {
    return `✅ All required environment variables are set. (${status.present.length} keys present)`;
  }
  return `❌ Missing environment variables: ${status.missing.join(", ")}`;
}

export function getProviderStatus(): Record<string, boolean> {
  return {
    agnes: !!process.env.AGNES_API_KEY,
    zhipu: !!process.env.ZHIPU_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  };
}
