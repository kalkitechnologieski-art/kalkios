import { NextRequest, NextResponse } from 'next/server'

interface LeadRow {
  name: string | null
  email: string | null
  phone: string | null
  website: string | null
  company: string | null
  job_title: string | null
  linkedin_url: string | null
  twitter_url: string | null
  city: string | null
  country: string | null
  verified: boolean
  score: number
}

export async function POST(req: NextRequest) {
  const { leads } = await req.json()
  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: 'No leads to export' }, { status: 400 })
  }

  const headers = [
    'Name', 'Email', 'Phone', 'Website', 'Company',
    'Job Title', 'LinkedIn URL', 'Twitter URL',
    'City', 'Country', 'Verified', 'Confidence'
  ]

  const rows = leads.map((lead: LeadRow) => [
    lead.name ?? '',
    lead.email ?? '',
    lead.phone ?? '',
    lead.website ?? '',
    lead.company ?? '',
    lead.job_title ?? '',
    lead.linkedin_url ?? '',
    lead.twitter_url ?? '',
    lead.city ?? '',
    lead.country ?? '',
    lead.verified ? 'Yes' : 'No',
    lead.score ?? 0,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row: (string | number)[]) =>
      row.map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n')

  return new NextResponse('\uFEFF' + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
