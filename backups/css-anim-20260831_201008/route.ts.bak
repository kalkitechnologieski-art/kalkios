import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export async function GET() {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('name, slug, category, description')
    .eq('is_active', true)

  // Type assertion to handle the never[] issue
  const typedServices = (services || []) as Service[]

  const content = `# KALKI OS — Enterprise AI Platform

## Overview
KALKI OS is an AI-powered digital services marketplace offering premium marketing, development, and cognitive solutions.

## Services

${typedServices.map(s => `- [${s.name}](https://kalkios.com/services/${s.category}/${s.slug}): ${s.description}`).join('\n')}

## Contact
- Website: https://kalkios.com
- Email: hello@kalkios.com
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
