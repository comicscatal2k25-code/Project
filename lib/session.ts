// Session management for username-based authentication

export interface UserSession {
  id: string
  username: string
  full_name: string | null
  role: string
  timestamp: number
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null
  
  try {
    const sessionData = localStorage.getItem('user_session')
    if (!sessionData) return null
    
    const session = JSON.parse(sessionData) as UserSession
    
    // Check if session is expired (7 days)
    const now = Date.now()
    const sessionAge = now - session.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    
    if (sessionAge > maxAge) {
      clearSession()
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error parsing session:', error)
    clearSession()
    return null
  }
}

export function setSession(user: Omit<UserSession, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  
  const session: UserSession = {
    ...user,
    timestamp: Date.now()
  }
  
  localStorage.setItem('user_session', JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('user_session')
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function hasRole(requiredRole: string): boolean {
  const session = getSession()
  if (!session) return false
  
  const roleHierarchy = {
    'viewer': 1,
    'analyst': 2,
    'lister': 3,
    'admin': 4
  }
  
  const userLevel = roleHierarchy[session.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userLevel >= requiredLevel
}

export function hasPermission(resource: string, action: string): boolean {
  const session = getSession()
  if (!session) return false
  
  // Admin has all permissions
  if (session.role === 'admin') return true
  
  // Define permission matrix
  const permissions: Record<string, Record<string, string[]>> = {
    'comics': {
      'create': ['admin', 'lister'],
      'read': ['admin', 'lister', 'analyst', 'viewer'],
      'update': ['admin', 'lister'],
      'delete': ['admin', 'lister']
    },
    'import': {
      'create': ['admin', 'lister']
    },
    'export': {
      'create': ['admin', 'lister']
    },
    'reports': {
      'read': ['admin', 'lister', 'analyst'],
      'create': ['admin', 'lister', 'analyst']
    },
    'settings': {
      'read': ['admin', 'lister', 'analyst', 'viewer'],
      'update': ['admin']
    },
    'users': {
      'create': ['admin'],
      'read': ['admin'],
      'update': ['admin'],
      'delete': ['admin']
    },
    'shopify': {
      'create': ['admin', 'lister'],
      'read': ['admin', 'lister'],
      'update': ['admin', 'lister'],
      'delete': ['admin', 'lister']
    }
  }
  
  const allowedRoles = permissions[resource]?.[action] || []
  return allowedRoles.includes(session.role)
}
