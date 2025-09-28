import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get session from cookie
    const sessionToken = request.cookies.get('session_token')?.value
    
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
    
    // Fetch the comic - ALL users can view ALL comics (shared catalog)
    const { data, error } = await supabase
      .from('comics')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching comic:', error)
      return NextResponse.json({ error: 'Comic not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/comics/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get session from cookie
    const sessionToken = request.cookies.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check permissions - only admin and lister can update comics
    if (!['admin', 'lister'].includes(sessionData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update comics' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    const supabase = await createClient()
    
    // Update the comic - admin and lister can update any comic
    const { data, error } = await supabase
      .from('comics')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating comic:', error)
      return NextResponse.json({ error: 'Failed to update comic' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/comics/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get session from cookie
    const sessionToken = request.cookies.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check permissions - only admin can delete comics
    if (sessionData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete comics' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    
    // Delete the comic - only admin can delete
    const { error } = await supabase
      .from('comics')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting comic:', error)
      return NextResponse.json({ error: 'Failed to delete comic' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/comics/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}