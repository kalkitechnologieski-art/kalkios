// == KALKI OS — TESTIMONIALS ==
// Reads approved client quotes for the public proof sections.
// An unavailable table (migration not applied yet) or an empty table must
// never break a page, so every failure path returns an empty list and the
// components fall back to honest, verifiable claims.
// -----------------------------------------------------------------------------

import { createPublicClient } from '@/lib/supabase/public-client'

export interface Testimonial {
  id: string
  authorName: string
  authorRole: string | null
  authorCompany: string | null
  city: string | null
  quote: string
  rating: number
}

const SELECT = 'id, author_name, author_role, author_company, city, quote, rating'

export async function fetchTestimonials(limit = 6): Promise<Testimonial[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('testimonials')
      // @ts-ignore - generated types lag the runtime table
      .select(SELECT)
      .eq('is_approved', true as any)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('[testimonials] unavailable:', error.message)
      return []
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      authorName: String(row.author_name ?? ''),
      authorRole: (row.author_role as string | null) ?? null,
      authorCompany: (row.author_company as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      quote: String(row.quote ?? ''),
      rating: Number(row.rating ?? 5),
    })).filter((t: Testimonial) => t.quote.length > 0 && t.authorName.length > 0)
  } catch (err) {
    console.warn('[testimonials] read failed', err)
    return []
  }
}
