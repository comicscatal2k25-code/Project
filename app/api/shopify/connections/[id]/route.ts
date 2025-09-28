import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// SHOPIFY: REVIEW - Delete store connection API with RBAC enforcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration is disabled' }, { status: 403 })
    }

    const supabase = await createClient()
    
    // Get session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to manage store connections (admin only)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const connectionId = params.id

    // First, delete all related publish jobs and their rows (cascade delete)
    const { error: deleteJobsError } = await supabase
      .from('publish_jobs')
      .delete()
      .eq('store_connection_id', connectionId)

    if (deleteJobsError) {
      console.error('Error deleting related publish jobs:', deleteJobsError)
      return NextResponse.json({ error: 'Failed to delete related publish jobs' }, { status: 500 })
    }

    // Now delete the store connection
    const { error: deleteError } = await supabase
      .from('store_connections')
      .delete()
      .eq('id', connectionId)

    if (deleteError) {
      console.error('Error deleting store connection:', deleteError)
      return NextResponse.json({ error: 'Failed to delete store connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete store connection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
