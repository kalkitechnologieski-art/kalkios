import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

// Demo data for server-side fallback
const DEMO_SERVICES = [
  { id: '1', name: 'Enterprise SEO', slug: 'enterprise-seo', category: 'Marketing', description: 'Rank #1 on Google with proven strategies.', price: 50000, icon: '📈', rating: 4.8, review_count: 120, is_active: true },
  { id: '2', name: 'AI Chatbot Development', slug: 'ai-chatbot', category: 'AI', description: 'Custom LLM-powered chatbot for your business.', price: 75000, icon: '🤖', rating: 4.9, review_count: 85, is_active: true },
  { id: '3', name: 'E-commerce Website', slug: 'ecommerce-website', category: 'Development', description: 'Full-featured online store with payment integration.', price: 100000, icon: '🛒', rating: 4.7, review_count: 210, is_active: true },
  { id: '4', name: 'Social Media Marketing', slug: 'social-media-marketing', category: 'Marketing', description: 'Dominate social media with targeted campaigns.', price: 30000, icon: '📢', rating: 4.6, review_count: 95, is_active: true },
  { id: '5', name: 'Predictive Analytics', slug: 'predictive-analytics', category: 'AI', description: 'Forecast trends and make data-driven decisions.', price: 90000, icon: '📊', rating: 4.8, review_count: 67, is_active: true },
  { id: '6', name: 'Mobile App Development', slug: 'mobile-app-development', category: 'Development', description: 'Native iOS and Android apps.', price: 150000, icon: '📱', rating: 4.9, review_count: 143, is_active: true },
]

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase server env vars missing — returning fallback client')
    // Return a client that returns demo data without throwing
    return new Proxy({} as any, {
      get: (_target: any, prop: string) => {
        if (prop === 'from') {
          return (_table: string) => ({
            select: () => ({
              eq: (_col: string, _val: any) => ({
                limit: (_n: number) => ({
                  then: (cb: any) => cb({ data: DEMO_SERVICES, error: null }),
                  catch: (cb: any) => cb(null),
                }),
                single: () => ({
                  then: (cb: any) => cb({ data: DEMO_SERVICES[0], error: null }),
                  catch: (cb: any) => cb(null),
                }),
              }),
            }),
          })
        }
        if (prop === 'auth') {
          return {
            getUser: () => ({ then: (cb: any) => cb({ data: { user: null }, error: null }) }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          }
        }
        return () => ({
          then: (cb: any) => cb({ data: null, error: null }),
          catch: (cb: any) => cb(null),
        })
      },
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
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.warn('Supabase admin env vars missing — returning fallback')
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
