import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

  if (!isValidUrl(url) || !key || key === '') {
    console.warn('Supabase env vars invalid or missing — returning fallback')
    return new Proxy({} as any, {
      get: () => () => ({
        then: (cb: any) => cb({ data: null, error: null }),
        catch: (cb: any) => cb(null),
      }),
    })
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
      remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
    },
  })
}

export async function createAdminClient() {
  return createClient()
}
