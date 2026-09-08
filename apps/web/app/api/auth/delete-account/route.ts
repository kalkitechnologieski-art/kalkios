import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
// @ts-ignore
      .from('profiles')
      .select('role')
      .eq('id', user.id as any)
// @ts-ignore
      .single() as any

    if (!profile || !['ceo', 'admin'].includes(profile.role)) {
      if (user.id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error

// @ts-ignore
    await supabase.from('profiles').delete().eq('id', userId as any)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 })
  }
}
