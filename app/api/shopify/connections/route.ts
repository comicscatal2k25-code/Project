import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// SHOPIFY: REVIEW - OAuth flow initiation for Shopify store connections
export async function GET(request: NextRequest) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session and admin role
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

    // Admin and lister can view store connections, but only admin can manage them
    if (!['admin', 'lister'].includes(sessionData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get all store connections
    const { data: connections, error } = await supabase
      .from('store_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching store connections:', error)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // Decrypt access tokens for display (but don't expose full token)
    const connectionsWithMaskedTokens = connections?.map(conn => ({
      ...conn,
      oauth_access_token: conn.oauth_access_token ? '***masked***' : null
    })) || []

    return NextResponse.json({
      success: true,
      data: connectionsWithMaskedTokens
    })

  } catch (error) {
    console.error('Store connections error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// SHOPIFY: REVIEW - Initiate OAuth connection
export async function POST(request: NextRequest) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session and admin role
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

    // Only admin can create store connections
    if (sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { shop } = await request.json()

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 })
    }

    // Validate shop format
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
      return NextResponse.json({ error: 'Invalid shop format' }, { status: 400 })
    }

    // Generate OAuth URL
    const apiKey = process.env.SHOPIFY_API_KEY
    console.log('OAuth initiation - SHOPIFY_API_KEY:', apiKey ? 'SET' : 'NOT SET')
    console.log('OAuth initiation - SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? 'SET' : 'NOT SET')
    console.log('OAuth initiation - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    
    if (!apiKey) {
      console.error('SHOPIFY_API_KEY is not set!')
      return NextResponse.json({ error: 'Shopify API key not configured' }, { status: 500 })
    }
    
    const scopes = 'read_products,write_products,read_orders,write_orders'
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/callback`
    const state = crypto.randomBytes(32).toString('hex')

    const oauthUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

    return NextResponse.json({
      success: true,
      data: {
        oauthUrl,
        state
      }
    })

  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
