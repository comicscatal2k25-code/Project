"use client"

import { useEffect, useState } from "react"
import { UserRole } from "@/lib/auth-client"
import { PERMISSION_CHECKS } from "@/lib/rbac/permissions"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
  requireAll?: boolean
}

export function RoleGuard({ children, allowedRoles, fallback, requireAll = false }: RoleGuardProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUserRole() {
      try {
        // Get session from server-side cookie
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          setLoading(false)
          return
        }

        const user = await response.json()
        setUserRole(user.role as UserRole)
      } catch (error) {
        console.error('Error loading user role:', error)
      }
      setLoading(false)
    }

    checkUserRole()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!userRole) {
    return fallback || null
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => role === userRole)
    : allowedRoles.includes(userRole)

  if (!hasAccess) {
    return fallback || (
      <div className="p-4 text-center text-gray-500">
        <p>You don't have permission to access this feature.</p>
        <p className="text-sm mt-1">Required role: {allowedRoles.join(' or ')}</p>
      </div>
    )
  }

  return <>{children}</>
}

interface PermissionGuardProps {
  children: React.ReactNode
  resource: string
  action: string
  fallback?: React.ReactNode
}

export function PermissionGuard({ children, resource, action, fallback }: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPermission() {
      try {
        // Get session from server-side cookie
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          setLoading(false)
          return
        }

        const user = await response.json()
        let role = user.role as UserRole
        
        // RBAC: Map old roles to new system when RBAC is disabled
        const rbacEnabled = process.env.NEXT_PUBLIC_FEATURE_RBAC === 'true'
        if (!rbacEnabled && role === 'user') {
          role = 'lister'
        }

        if (!rbacEnabled) {
          // Use simple permission logic when RBAC is disabled
          const hasPermission = PERMISSION_CHECKS[`can${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof PERMISSION_CHECKS]?.(role) ?? false
          setHasPermission(hasPermission)
        } else {
          // Use database permissions when RBAC is enabled
          const supabase = createClient()
          const { data: permission } = await supabase
            .from('permissions')
            .select('granted')
            .eq('role', role)
            .eq('resource', resource)
            .eq('action', action)
            .single()

          setHasPermission(permission?.granted ?? false)
        }
      } catch (error) {
        console.error('Error checking permission:', error)
      }
      
      setLoading(false)
    }

    checkPermission()
  }, [resource, action])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!hasPermission) {
    return fallback || (
      <div className="p-4 text-center text-gray-500">
        <p>You don't have permission to perform this action.</p>
        <p className="text-sm mt-1">Required: {action} on {resource}</p>
      </div>
    )
  }

  return <>{children}</>
}
