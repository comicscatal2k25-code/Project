import { getCurrentUserProfile, hasPermission, isAdmin } from '@/lib/auth-client'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
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

describe('RBAC Auth Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getCurrentUserProfile', () => {
    it('should return null when user is not authenticated', async () => {
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getCurrentUserProfile()
      expect(result).toBeNull()
    })

    it('should return user profile when authenticated', async () => {
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'lister',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      })

      const result = await getCurrentUserProfile()
      
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'lister',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      })
    })

    it('should map old user role to lister when RBAC is disabled', async () => {
      process.env.NEXT_PUBLIC_FEATURE_RBAC = 'false'
      
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user', // Old role
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      })

      const result = await getCurrentUserProfile()
      
      expect(result?.role).toBe('lister') // Should be mapped to lister
    })
  })

  describe('hasPermission', () => {
    it('should return true for admin when RBAC is disabled', async () => {
      process.env.NEXT_PUBLIC_FEATURE_RBAC = 'false'
      
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
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

      const result = await hasPermission('comics', 'create')
      expect(result).toBe(true)
    })

    it('should return false for viewer when RBAC is disabled', async () => {
      process.env.NEXT_PUBLIC_FEATURE_RBAC = 'false'
      
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
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

      const result = await hasPermission('comics', 'create')
      expect(result).toBe(false)
    })

    it('should use database permissions when RBAC is enabled', async () => {
      process.env.NEXT_PUBLIC_FEATURE_RBAC = 'true'
      
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
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
                  single: jest.fn().mockResolvedValue({
                    data: { granted: true },
                    error: null
                  })
                })
              })
            })
          }
        }
      })

      const result = await hasPermission('comics', 'create')
      expect(result).toBe(true)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
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

      const result = await isAdmin()
      expect(result).toBe(true)
    })

    it('should return false for non-admin role', async () => {
      const mockSupabase = require('@/lib/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'lister' },
              error: null
            })
          })
        })
      })

      const result = await isAdmin()
      expect(result).toBe(false)
    })
  })
})
