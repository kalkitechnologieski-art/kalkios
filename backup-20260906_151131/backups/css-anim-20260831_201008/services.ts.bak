import { createClient } from '@/lib/supabase/client'
import servicesData from '@/lib/mock/services.json'
import type { Database } from '@/lib/supabase/types'

// Extend the base Service type to include our extra fields
type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

let isSupabaseAvailable: boolean | null = null

export async function checkSupabaseConnection(): Promise<boolean> {
  if (isSupabaseAvailable !== null) return isSupabaseAvailable
  try {
    const supabase = createClient()
    const { error } = await supabase.from('services').select('id').limit(1)
    isSupabaseAvailable = !error
    return isSupabaseAvailable
  } catch {
    isSupabaseAvailable = false
    return false
  }
}

export async function fetchServices(): Promise<Service[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.warn('⚠️ Supabase error, falling back to mock JSON:', error.message)
      isSupabaseAvailable = false
      return servicesData as Service[]
    }

    if (data && data.length > 0) {
      isSupabaseAvailable = true
      return data as Service[]
    }

    console.warn('⚠️ No services found in Supabase, using mock JSON')
    isSupabaseAvailable = false
    return servicesData as Service[]
  } catch (err) {
    console.warn('⚠️ Failed to fetch from Supabase, using mock JSON:', err)
    isSupabaseAvailable = false
    return servicesData as Service[]
  }
}

export async function fetchServiceBySlug(category: string, slug: string): Promise<Service | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .eq('category', category)
      .single()

    if (error) {
      console.warn('⚠️ Supabase error, looking in mock JSON:', error.message)
      isSupabaseAvailable = false
      const mock = servicesData.find(s => s.slug === slug && s.category === category)
      return mock || null
    }

    if (data) {
      isSupabaseAvailable = true
      return data as Service
    }

    // Fallback to mock
    const mock = servicesData.find(s => s.slug === slug && s.category === category)
    return mock || null
  } catch {
    const mock = servicesData.find(s => s.slug === slug && s.category === category)
    return mock || null
  }
}

export function getSupabaseStatus(): boolean {
  return isSupabaseAvailable ?? false
}
