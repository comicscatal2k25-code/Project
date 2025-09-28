import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/lib/auth-server"

export type RBACPermission = {
  resource: string
  action: string
}

export type RBACConfig = {
  requiredRole?: UserRole
  requiredPermissions?: RBACPermission[]
  requireAll?: boolean // If true, user must have ALL permissions; if false, ANY permission
  bypassForAdmin?: boolean // If true, admin role bypasses all checks
}

/**
 * RBAC Middleware for API routes and SSR
 * Checks if the current user has the required role or permissions
 */
export async function rbacMiddleware(
  request: NextRequest,
  config: RBACConfig
): Promise<{ allowed: boolean; user?: any; profile?: any; error?: string }> {
  // Check if RBAC is enabled via feature flag
  const rbacEnabled = process.env.FEATURE_RBAC === 'true'
  
  if (!rbacEnabled) {
    // RBAC disabled - allow all authenticated users
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { allowed: false, error: 'Authentication required' }
    }
    
    return { allowed: true, user }
  }

  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { allowed: false, error: 'Authentication required' }
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { allowed: false, error: 'User profile not found' }
    }

    // Admin bypass (if enabled)
    if (config.bypassForAdmin !== false && profile.role === 'admin') {
      return { allowed: true, user, profile }
    }

    // Check required role
    if (config.requiredRole && profile.role !== config.requiredRole) {
      return { 
        allowed: false, 
        user, 
        profile, 
        error: `Required role: ${config.requiredRole}, user has: ${profile.role}` 
      }
    }

    // Check required permissions
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      const permissionChecks = await Promise.all(
        config.requiredPermissions.map(async (permission) => {
          const { data: perm } = await supabase
            .from('permissions')
            .select('granted')
            .eq('role', profile.role)
            .eq('resource', permission.resource)
            .eq('action', permission.action)
            .single()

          return perm?.granted ?? false
        })
      )

      const hasRequiredPermissions = config.requireAll
        ? permissionChecks.every(Boolean)
        : permissionChecks.some(Boolean)

      if (!hasRequiredPermissions) {
        return { 
          allowed: false, 
          user, 
          profile, 
          error: `Insufficient permissions for role: ${profile.role}` 
        }
      }
    }

    return { allowed: true, user, profile }

  } catch (error) {
    console.error('RBAC middleware error:', error)
    return { allowed: false, error: 'Internal server error' }
  }
}

/**
 * Wrapper for API route handlers with RBAC protection
 */
export function withRBAC(config: RBACConfig) {
  return function(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
    return async function(request: NextRequest, context: any): Promise<NextResponse> {
      const rbacResult = await rbacMiddleware(request, config)
      
      if (!rbacResult.allowed) {
        // Log the denied attempt
        if (rbacResult.user) {
          try {
            const supabase = await createClient()
            await supabase.rpc('log_audit_event', {
              p_actor_user_id: rbacResult.user.id,
              p_action: 'access_denied',
              p_resource: request.nextUrl.pathname,
              p_outcome: 'denied',
              p_ip: request.ip || request.headers.get('x-forwarded-for'),
              p_user_agent: request.headers.get('user-agent'),
              p_metadata: {
                reason: rbacResult.error,
                required_role: config.requiredRole,
                required_permissions: config.requiredPermissions
              }
            })
          } catch (logError) {
            console.error('Failed to log audit event:', logError)
          }
        }

        return NextResponse.json(
          { error: 'Access denied', details: rbacResult.error },
          { status: 403 }
        )
      }

      // Add user and profile to request context
      const enhancedContext = {
        ...context,
        user: rbacResult.user,
        profile: rbacResult.profile
      }

      return handler(request, enhancedContext)
    }
  }
}

/**
 * Helper function to check permissions in API routes
 */
export async function checkPermission(
  resource: string, 
  action: string, 
  userId?: string
): Promise<boolean> {
  const rbacEnabled = process.env.FEATURE_RBAC === 'true'
  
  if (!rbacEnabled) {
    return true // Allow all when RBAC is disabled
  }

  try {
    const supabase = await createClient()
    
    let user
    if (userId) {
      // Check specific user
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      user = userData.user
    } else {
      // Check current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user = currentUser
    }

    if (!user) return false

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) return false

    // Admin bypass
    if (profile.role === 'admin') return true

    // Check specific permission
    const { data: permission } = await supabase
      .from('permissions')
      .select('granted')
      .eq('role', profile.role)
      .eq('resource', resource)
      .eq('action', action)
      .single()

    return permission?.granted ?? false

  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * Helper function to check if user has admin role
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const rbacEnabled = process.env.FEATURE_RBAC === 'true'
  
  if (!rbacEnabled) {
    // When RBAC is disabled, check the old role system
    try {
      const supabase = await createClient()
      
      let user
      if (userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        user = userData.user
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        user = currentUser
      }

      if (!user) return false

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      return profile?.role === 'admin'
    } catch {
      return false
    }
  }

  return await checkPermission('users', 'create', userId)
}

/**
 * Helper function to get user role
 */
export async function getUserRole(userId?: string): Promise<UserRole | null> {
  try {
    const supabase = await createClient()
    
    let user
    if (userId) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      user = userData.user
    } else {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user = currentUser
    }

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role as UserRole || null
  } catch {
    return null
  }
}
