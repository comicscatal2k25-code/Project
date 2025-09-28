import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// SHOPIFY: REVIEW - Individual job details API with RBAC
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session and role
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get job with RBAC check
    let query = supabase
      .from('publish_jobs')
      .select(`
        *,
        store_connections(store_name, shopify_shop),
        publish_job_rows(*)
      `)
      .eq('id', params.id)

    // Apply RBAC filtering
    if (sessionData.role !== 'admin') {
      query = query.eq('user_id', sessionData.user_id)
    }

    const { data: job, error } = await query.single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Filter job rows based on role
    let jobRows = job.publish_job_rows
    if (sessionData.role === 'viewer') {
      // Viewers can only see basic status, not error details
      jobRows = jobRows.map((row: any) => ({
        id: row.id,
        status: row.status,
        attempts: row.attempts,
        last_attempt_at: row.last_attempt_at
        // Exclude error_message and Shopify IDs for viewers
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        publish_job_rows: jobRows
      }
    })

  } catch (error) {
    console.error('Get job details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// SHOPIFY: REVIEW - Retry failed job rows with RBAC
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session and role
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Only admin and lister can retry jobs
    if (!['admin', 'lister'].includes(sessionData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { row_ids } = await request.json()

    const supabase = await createClient()

    // Verify job exists and user has access
    let query = supabase
      .from('publish_jobs')
      .select('*')
      .eq('id', params.id)

    if (sessionData.role !== 'admin') {
      query = query.eq('user_id', sessionData.user_id)
    }

    const { data: job, error: jobError } = await query.single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Reset failed rows to pending
    const { error: resetError } = await supabase
      .from('publish_job_rows')
      .update({ 
        status: 'pending',
        error_message: null,
        attempts: 0
      })
      .eq('publish_job_id', params.id)
      .in('id', row_ids || [])
      .eq('status', 'failed')

    if (resetError) {
      console.error('Error resetting job rows:', resetError)
      return NextResponse.json({ error: 'Failed to reset job rows' }, { status: 500 })
    }

    // Update job status back to processing
    await supabase
      .from('publish_jobs')
      .update({ status: 'processing' })
      .eq('id', params.id)

    // TODO: Trigger job processing for the reset rows

    return NextResponse.json({
      success: true,
      data: {
        message: 'Job rows reset and queued for retry'
      }
    })

  } catch (error) {
    console.error('Retry job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
