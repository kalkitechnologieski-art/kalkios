import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Supabase client that does NOT use cookies or SSR.
 * Safe to use inside `"use cache"` functions.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || !url.startsWith('https://')) {
    throw new Error(
      'Missing or invalid Supabase environment variables.\n' +
      'Please check your .env.local file.\n' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    )
  }

  return createClient<Database>(url, key)
}
