import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check for username-based session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Parse the session token
    const sessionData = JSON.parse(atob(sessionToken))
    const userRole = sessionData.role

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const condition = searchParams.get('condition')
    const publisher = searchParams.get('publisher')
    const forSale = searchParams.get('for_sale')
    const shopifySynced = searchParams.get('shopify_synced')

    const supabase = await createClient()

    // Build the query - ALL users see ALL comics (shared catalog)
    let query = supabase
      .from("comics")
      .select(`
        id,
        title,
        created_at,
        current_value,
        acquired_price,
        compare_at_price,
        inventory_quantity,
        condition,
        grade,
        grading_service,
        is_key_issue,
        for_sale,
        publisher,
        series,
        era,
        tags,
        handle,
        product_type,
        vendor,
        barcode,
        image_url,
        user_id
      `)
      .order("created_at", { ascending: false })

    // Apply search filters with fuzzy matching
    if (search) {
      // Search across multiple fields for better results
      query = query.or(`title.ilike.%${search}%,series.ilike.%${search}%,publisher.ilike.%${search}%,tags.cs.{${search}}`)
    }

    if (condition) {
      query = query.eq("condition", condition)
    }

    if (publisher) {
      query = query.ilike("publisher", `%${publisher}%`)
    }

    if (forSale === 'true') {
      query = query.eq("for_sale", true)
    } else if (forSale === 'false') {
      query = query.eq("for_sale", false)
    }

    if (shopifySynced === 'true') {
      query = query.eq("shopify_synced", true)
    } else if (shopifySynced === 'false') {
      query = query.eq("shopify_synced", false)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching comics:", error)
      return NextResponse.json(
        { error: "Failed to fetch comics" },
        { status: 500 }
      )
    }

    console.log(`Found ${data?.length || 0} comics for user with role ${userRole}`)
    console.log('Comics data:', data)

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Comics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for username-based session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Parse the session token
    const sessionData = JSON.parse(atob(sessionToken))
    const userRole = sessionData.role
    const userId = sessionData.user_id

    // Check permissions - only admin and lister can create comics
    if (!['admin', 'lister'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create comics' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    const supabase = await createClient()
    
    // Create the comic - use the current user as the creator
    const { data, error } = await supabase
      .from('comics')
      .insert({
        ...body,
        user_id: userId, // Track who created the comic
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating comic:', error)
      return NextResponse.json({ error: 'Failed to create comic' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/comics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
