import { rbacMiddleware, withRBAC } from '@/lib/rbac/middleware'
import { NextRequest } from 'next/server'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

// Mock environment variables
const originalEnv = process.env

describe('RBAC Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('rbacMiddleware', () => {
    it('should allow access when RBAC is disabled', async () => {
      process.env.FEATURE_RBAC = 'false'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      const result = await rbacMiddleware(mockRequest, {
        requiredRole: 'admin'
      })

      expect(result.allowed).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should deny access when user is not authenticated', async () => {
      process.env.FEATURE_RBAC = 'true'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await rbacMiddleware(mockRequest, {
        requiredRole: 'admin'
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should allow admin to bypass all checks', async () => {
      process.env.FEATURE_RBAC = 'true'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      const result = await rbacMiddleware(mockRequest, {
        requiredRole: 'lister',
        requiredPermissions: [{ resource: 'comics', action: 'create' }]
      })

      expect(result.allowed).toBe(true)
      expect(result.profile?.role).toBe('admin')
    })

    it('should deny access when user lacks required role', async () => {
      process.env.FEATURE_RBAC = 'true'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'viewer' },
              error: null
            })
          })
        })
      })

      const result = await rbacMiddleware(mockRequest, {
        requiredRole: 'admin'
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Required role: admin')
    })

    it('should allow access when user has required permission', async () => {
      process.env.FEATURE_RBAC = 'true'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      // Mock profile fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'lister' },
                  error: null
                })
              })
            })
          }
        }
        // Mock permissions fetch
        if (table === 'permissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { granted: true },
                      error: null
                    })
                  })
                })
              })
            })
          }
        }
      })

      const result = await rbacMiddleware(mockRequest, {
        requiredPermissions: [{ resource: 'comics', action: 'create' }]
      })

      expect(result.allowed).toBe(true)
    })

    it('should deny access when user lacks required permission', async () => {
      process.env.FEATURE_RBAC = 'true'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      // Mock profile fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'viewer' },
                  error: null
                })
              })
            })
          }
        }
        // Mock permissions fetch
        if (table === 'permissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { granted: false },
                      error: null
                    })
                  })
                })
              })
            })
          }
        }
      })

      const result = await rbacMiddleware(mockRequest, {
        requiredPermissions: [{ resource: 'comics', action: 'create' }]
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Insufficient permissions')
    })
  })

  describe('withRBAC wrapper', () => {
    it('should call handler when access is allowed', async () => {
      process.env.FEATURE_RBAC = 'false'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockHandler = jest.fn().mockResolvedValue(new Response('OK'))
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      const wrappedHandler = withRBAC({
        requiredRole: 'admin'
      })(mockHandler)

      await wrappedHandler(mockRequest, {})

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, {
        user: { id: 'user-1' }
      })
    })

    it('should return 403 when access is denied', async () => {
      process.env.FEATURE_RBAC = 'true'
      
      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const mockHandler = jest.fn()
      const mockSupabase = require('@/lib/supabase/server').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const wrappedHandler = withRBAC({
        requiredRole: 'admin'
      })(mockHandler)

      const response = await wrappedHandler(mockRequest, {})
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Access denied')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})
