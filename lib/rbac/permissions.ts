import { UserRole } from "@/lib/auth-server"

/**
 * RBAC Permission Matrix
 * Defines what each role can do
 */
export const RBAC_PERMISSIONS = {
  admin: {
    comics: ['create', 'read', 'update', 'delete'],
    import: ['create'],
    export: ['create'],
    reports: ['read', 'create'],
    settings: ['read', 'update'],
    users: ['create', 'read', 'update', 'delete'],
    shopify: ['create', 'read', 'update', 'delete']
  },
  lister: {
    comics: ['create', 'read', 'update', 'delete'],
    import: ['create'],
    export: ['create'],
    reports: ['read', 'create'],
    settings: ['read'],
    shopify: ['create', 'read', 'update', 'delete']
  },
  analyst: {
    comics: ['read'],
    reports: ['read', 'create'],
    settings: ['read']
  },
  viewer: {
    comics: ['read'],
    settings: ['read']
  }
} as const

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const rolePermissions = RBAC_PERMISSIONS[role]
  if (!rolePermissions) return false
  
  const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions]
  if (!resourcePermissions) return false
  
  return resourcePermissions.includes(action as any)
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Record<string, string[]> {
  return RBAC_PERMISSIONS[role] || {}
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(resource: string, action: string): UserRole[] {
  const roles: UserRole[] = []
  
  for (const [role, permissions] of Object.entries(RBAC_PERMISSIONS)) {
    if (hasPermission(role as UserRole, resource, action)) {
      roles.push(role as UserRole)
    }
  }
  
  return roles
}

/**
 * Permission check helpers for common operations
 */
export const PERMISSION_CHECKS = {
  canManageComics: (role: UserRole) => hasPermission(role, 'comics', 'create') || hasPermission(role, 'comics', 'update'),
  canViewComics: (role: UserRole) => hasPermission(role, 'comics', 'read'),
  canDeleteComics: (role: UserRole) => hasPermission(role, 'comics', 'delete'),
  canImportExport: (role: UserRole) => hasPermission(role, 'import', 'create') || hasPermission(role, 'export', 'create'),
  canRunReports: (role: UserRole) => hasPermission(role, 'reports', 'read') || hasPermission(role, 'reports', 'create'),
  canManageSettings: (role: UserRole) => hasPermission(role, 'settings', 'update'),
  canViewSettings: (role: UserRole) => hasPermission(role, 'settings', 'read'),
  canManageUsers: (role: UserRole) => hasPermission(role, 'users', 'create') || hasPermission(role, 'users', 'update'),
  canManageShopify: (role: UserRole) => hasPermission(role, 'shopify', 'create') || hasPermission(role, 'shopify', 'update')
} as const

/**
 * UI-friendly permission descriptions
 */
export const PERMISSION_DESCRIPTIONS = {
  comics: {
    create: 'Add new comics to the catalog',
    read: 'View comics in the catalog',
    update: 'Edit existing comic details',
    delete: 'Remove comics from the catalog'
  },
  import: {
    create: 'Import comics from external sources'
  },
  export: {
    create: 'Export comics to external formats'
  },
  reports: {
    read: 'View existing reports',
    create: 'Generate new reports'
  },
  settings: {
    read: 'View application settings',
    update: 'Modify application settings'
  },
  users: {
    create: 'Create new user accounts',
    read: 'View user information',
    update: 'Modify user accounts',
    delete: 'Remove user accounts'
  },
  shopify: {
    create: 'Create Shopify listings',
    read: 'View Shopify integration',
    update: 'Modify Shopify listings',
    delete: 'Remove Shopify listings'
  }
} as const

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, { name: string; description: string; color: string }> = {
  admin: {
    name: 'Administrator',
    description: 'Full access to all features and settings',
    color: 'text-red-600 bg-red-50'
  },
  lister: {
    name: 'Lister',
    description: 'Can add/edit comics and manage Shopify listings',
    color: 'text-blue-600 bg-blue-50'
  },
  analyst: {
    name: 'Analyst',
    description: 'Can view comics and run reports',
    color: 'text-green-600 bg-green-50'
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to comics catalog',
    color: 'text-gray-600 bg-gray-50'
  }
}
