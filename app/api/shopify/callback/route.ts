import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// SHOPIFY: REVIEW - OAuth callback handler for Shopify store connections
export async function GET(request: NextRequest) {
  try {
    // Debug logging
    console.log('OAuth callback called')
    console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? 'SET' : 'NOT SET')
    console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? 'SET' : 'NOT SET')
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const shop = searchParams.get('shop')
    const hmac = searchParams.get('hmac')

    if (!code || !state || !shop || !hmac) {
      return NextResponse.json({ error: 'Missing OAuth parameters' }, { status: 400 })
    }

    // Verify HMAC
    const queryString = new URLSearchParams(searchParams)
    queryString.delete('hmac')
    queryString.delete('signature')
    const message = queryString.toString()
    const calculatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(message)
      .digest('hex')

    if (calculatedHmac !== hmac) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    })

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const scopes = tokenData.scope.split(',')

    // Get shop information
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    })

    if (!shopResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch shop information' }, { status: 400 })
    }

    const shopData = await shopResponse.json()
    const storeName = shopData.shop.name

    // Encrypt access token
    const encryptedToken = encryptToken(accessToken)

    // Store connection in database
    const supabase = await createClient()
    
    // Get current user from session (we need to find a way to get user ID from state)
    // For now, we'll use a placeholder - in production, you'd store state with user ID
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { error: insertError } = await supabase
      .from('store_connections')
      .insert({
        store_name: storeName,
        shopify_shop: shop,
        oauth_access_token: encryptedToken,
        scopes: scopes,
        created_by: sessionData.user_id
      })

    if (insertError) {
      console.error('Error storing connection:', insertError)
      return NextResponse.json({ error: 'Failed to store connection' }, { status: 500 })
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/shopify?connected=true`)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/shopify?error=callback_failed`)
  }
}

// SHOPIFY: REVIEW - Simple encryption for access tokens
function encryptToken(token: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-key', 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

function decryptToken(encryptedToken: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-key', 'salt', 32)
  
  const [ivHex, encrypted] = encryptedToken.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
