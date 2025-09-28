/**
 * Session utility functions for managing user sessions
 */

export interface SessionData {
  user_id: string
  username: string
  full_name: string
  role: string
  timestamp: number
  expires_at: number
}

export interface SessionValidationResult {
  valid: boolean
  user?: {
    id: string
    username: string
    role: string
    full_name: string
  }
  error?: string
}

/**
 * Create a new session token with expiration
 */
export function createSessionToken(user: {
  user_id: string
  username: string
  full_name: string
  role: string
}): string {
  const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
  const sessionData: SessionData = {
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    timestamp: Date.now(),
    expires_at: sessionExpiry
  }
  
  return btoa(JSON.stringify(sessionData))
}

/**
 * Validate a session token and return user data if valid
 */
export function validateSessionToken(sessionToken: string): SessionValidationResult {
  try {
    const sessionData: SessionData = JSON.parse(atob(sessionToken))
    
    // Check if session has expired
    const now = Date.now()
    const expiresAt = sessionData.expires_at || (sessionData.timestamp + (24 * 60 * 60 * 1000)) // fallback for old sessions
    
    if (now > expiresAt) {
      return {
        valid: false,
        error: 'Session expired'
      }
    }
    
    return {
      valid: true,
      user: {
        id: sessionData.user_id,
        username: sessionData.username,
        role: sessionData.role,
        full_name: sessionData.full_name || sessionData.username
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid session token'
    }
  }
}

/**
 * Get session expiration time in milliseconds
 */
export function getSessionExpiration(): number {
  return Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(sessionToken: string): boolean {
  const validation = validateSessionToken(sessionToken)
  return !validation.valid
}
