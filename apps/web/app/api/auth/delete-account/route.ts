import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = await createAdminClient() // Uses service role key
    // Verify the current user is admin or the same user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is an admin (allow only admins to delete accounts)
    // For safety, we require admin role to delete any account
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['ceo', 'admin'].includes(profile.role)) {
      // If the user is not admin, they can only delete their own account
      if (user.id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Delete user from auth (requires admin privileges)
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error

    // Also delete from profiles (cascade may handle, but we can do manually)
    await supabase.from('profiles').delete().eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 })
  }
}
