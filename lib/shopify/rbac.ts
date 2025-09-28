import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// SHOPIFY: REVIEW - RBAC middleware for Shopify endpoints

export interface SessionData {
  user_id: string
  role: string
  username: string
  full_name: string
}

export async function validateShopifyAccess(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ sessionData: SessionData } | NextResponse> {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData: SessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check role permissions
    if (!allowedRoles.includes(sessionData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return { sessionData }

  } catch (error) {
    console.error('RBAC validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// SHOPIFY: REVIEW - Role-based access control helpers
export const SHOPIFY_RBAC = {
  // Admin only
  ADMIN_ONLY: ['admin'],
  
  // Admin and Lister
  ADMIN_LISTER: ['admin', 'lister'],
  
  // Admin, Lister, and Analyst
  ADMIN_LISTER_ANALYST: ['admin', 'lister', 'analyst'],
  
  // All roles (including Viewer)
  ALL_ROLES: ['admin', 'lister', 'analyst', 'viewer']
}

// SHOPIFY: REVIEW - Audit logging for Shopify actions
export async function logShopifyAction(
  userId: string,
  action: string,
  details: any,
  outcome: 'success' | 'failure' = 'success'
) {
  try {
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient())
    
    await supabase
      .from('audit_logs')
      .insert({
        profile_id: userId,
        action: `shopify_${action}`,
        details: {
          ...details,
          outcome,
          timestamp: new Date().toISOString()
        }
      })
  } catch (error) {
    console.error('Error logging Shopify action:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

// SHOPIFY: REVIEW - Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const key = `${userId}:${action}`
  const now = Date.now()
  const windowStart = now - windowMs

  const current = rateLimitMap.get(key)
  
  if (!current || current.resetTime < windowStart) {
    // Reset window
    rateLimitMap.set(key, { count: 1, resetTime: now })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// SHOPIFY: REVIEW - Input validation helpers
export function validateShopifyInput(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`
    }
  }
  return null
}

export function validateShopifyShop(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)
}

export function validateShopifyVariantIds(ids: any): boolean {
  return Array.isArray(ids) && ids.length > 0 && ids.every(id => typeof id === 'string')
}
