import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export default async function sitemap() {
  const baseUrl = 'https://kalkios.com'
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('slug, category, updated_at')
    .eq('is_active', true)

  // Type assertion to handle the never[] issue
  const typedServices = (services || []) as Service[]

  const serviceUrls = typedServices.map((s) => ({
    url: `${baseUrl}/services/${s.category}/${s.slug}`,
    lastModified: s.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...serviceUrls,
  ]
}
