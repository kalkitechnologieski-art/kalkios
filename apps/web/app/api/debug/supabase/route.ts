import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        hint: 'Check RLS or table existence'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      sample: data,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ set' : '❌ missing',
      }
    })
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: String(err) 
    }, { status: 500 })
  }
}
