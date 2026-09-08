import { createClient as createSupabaseClient } from './server'

/**
 * Creates a Supabase client that can be used inside `'use cache'` functions.
 * It does NOT call `connection()`, so it can be cached.
 * Use this for public data that doesn't depend on the request.
 */
export async function createCachedClient() {
  return createSupabaseClient()
}
