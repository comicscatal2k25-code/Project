import { createClient } from "@/lib/supabase/client"

export type UserRole = 'admin' | 'lister' | 'analyst' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Permission {
  resource: string
  action: string
  granted: boolean
}

/**
 * Get the current user's profile with role information (CLIENT-SIDE)
 * Includes RBAC feature flag support
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  // RBAC: If RBAC is disabled, map old roles to new system
  const rbacEnabled = process.env.NEXT_PUBLIC_FEATURE_RBAC === 'true'
  if (!rbacEnabled && profile.role === 'user') {
    // Map 'user' role to 'lister' for backward compatibility
    profile.role = 'lister'
  }

  return profile as UserProfile
}

/**
 * Check if the current user has a specific permission (CLIENT-SIDE)
 * Includes RBAC feature flag support
 */
export async function hasPermission(resource: string, action: string): Promise<boolean> {
  const rbacEnabled = process.env.NEXT_PUBLIC_FEATURE_RBAC === 'true'
  
  if (!rbacEnabled) {
    // When RBAC is disabled, use simple role-based checks
    const profile = await getCurrentUserProfile()
    if (!profile) return false
    
    // Simple permission logic for backward compatibility
    if (profile.role === 'admin') return true
    if (profile.role === 'lister' || profile.role === 'user') {
      // Allow most operations for lister/user role
      return !['users', 'settings'].includes(resource) || action === 'read'
    }
    return action === 'read' // Viewers can only read
  }

  const profile = await getCurrentUserProfile()
  if (!profile) return false

  const supabase = createClient()
  
  const { data: permission } = await supabase
    .from('permissions')
    .select('granted')
    .eq('role', profile.role)
    .eq('resource', resource)
    .eq('action', action)
    .single()

  return permission?.granted ?? false
}

/**
 * Check if the current user has any of the specified permissions (CLIENT-SIDE)
 */
export async function hasAnyPermission(permissions: Array<{resource: string, action: string}>): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission.resource, permission.action)) {
      return true
    }
  }
  return false
}

/**
 * Check if the current user has all of the specified permissions (CLIENT-SIDE)
 */
export async function hasAllPermissions(permissions: Array<{resource: string, action: string}>): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission.resource, permission.action))) {
      return false
    }
  }
  return true
}

/**
 * Get all permissions for the current user's role (CLIENT-SIDE)
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const profile = await getCurrentUserProfile()
  if (!profile) return []

  const supabase = createClient()
  
  const { data: permissions } = await supabase
    .from('permissions')
    .select('resource, action, granted')
    .eq('role', profile.role)

  return permissions || []
}

/**
 * Check if user has admin role (CLIENT-SIDE)
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'admin'
}

/**
 * Check if user can create/edit comics (CLIENT-SIDE)
 */
export async function canManageComics(): Promise<boolean> {
  return await hasAnyPermission([
    { resource: 'comics', action: 'create' },
    { resource: 'comics', action: 'update' }
  ])
}

/**
 * Check if user can manage Shopify integration (CLIENT-SIDE)
 */
export async function canManageShopify(): Promise<boolean> {
  return await hasAnyPermission([
    { resource: 'shopify', action: 'create' },
    { resource: 'shopify', action: 'update' }
  ])
}

/**
 * Check if user can run reports (CLIENT-SIDE)
 */
export async function canRunReports(): Promise<boolean> {
  return await hasPermission('reports', 'read')
}

/**
 * Check if user can manage settings (CLIENT-SIDE)
 */
export async function canManageSettings(): Promise<boolean> {
  return await hasPermission('settings', 'update')
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    lister: 'Lister',
    analyst: 'Analyst',
    viewer: 'Viewer'
  }
  return roleNames[role]
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Full access to all features and settings',
    lister: 'Can add/edit comics and manage Shopify listings',
    analyst: 'Can view comics and run reports',
    viewer: 'Read-only access to comics catalog'
  }
  return descriptions[role]
}
