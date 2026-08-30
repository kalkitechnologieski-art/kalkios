#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${PWD}/apps/web"

# Fix the validation.ts file with proper types
cat > "${APP_DIR}/lib/env/validation.ts" << 'ENV_EOF'
/**
 * Environment variable validation
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
    if (process.env[key] && process.env[key]!.length > 0) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_KEYS) {
    if (process.env[key] && process.env[key]!.length > 0) {
      present.push(key);
    }
  }

  return {
    valid: present.length > 0 && missing.length === 0,
    missing,
    present,
  };
}

export function getProviderStatus(): Record<string, boolean> {
  return {
    agnes: !!(process.env.AGNES_API_KEY && process.env.AGNES_API_KEY.length > 0),
    zhipu: !!(process.env.ZHIPU_API_KEY && process.env.ZHIPU_API_KEY.length > 0),
    groq: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 0),
    openrouter: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 0),
  };
}

export function hasAnyProvider(): boolean {
  const status = getProviderStatus();
  return !!(status.agnes || status.zhipu || status.groq || status.openrouter);
}
ENV_EOF

cd "${APP_DIR}"

echo "Running TypeScript check..."
npm run type-check

echo "Building project..."
npm run build

echo "✅ Fix applied successfully. Build passed."