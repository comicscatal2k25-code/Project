import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { validateShopifyAccess, SHOPIFY_RBAC } from '@/lib/shopify/rbac'

// SHOPIFY: REVIEW - RBAC tests for Shopify integration

describe('Shopify RBAC', () => {
  beforeEach(() => {
    // Mock environment
    process.env.FEATURE_SHOPIFY = 'true'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.FEATURE_SHOPIFY
  })

  describe('validateShopifyAccess', () => {
    it('should reject requests when Shopify feature is disabled', async () => {
      process.env.FEATURE_SHOPIFY = 'false'
      
      const request = new NextRequest('http://localhost:3000/api/shopify/test')
      const result = await validateShopifyAccess(request, SHOPIFY_RBAC.ALL_ROLES)
      
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(403)
    })

    it('should reject requests without session token', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/test')
      
      // Mock cookies to return no session token
      vi.mock('next/headers', () => ({
        cookies: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue(null)
        })
      }))
      
      const result = await validateShopifyAccess(request, SHOPIFY_RBAC.ALL_ROLES)
      
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(401)
    })

    it('should reject requests with invalid session token', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/test')
      
      // Mock cookies to return invalid session token
      vi.mock('next/headers', () => ({
        cookies: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue({ value: 'invalid-token' })
        })
      }))
      
      const result = await validateShopifyAccess(request, SHOPIFY_RBAC.ALL_ROLES)
      
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(401)
    })

    it('should reject requests with insufficient permissions', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/test')
      
      // Mock cookies to return valid session with viewer role
      const sessionData = {
        user_id: 'user-123',
        role: 'viewer',
        username: 'testuser',
        full_name: 'Test User'
      }
      
      vi.mock('next/headers', () => ({
        cookies: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue({ 
            value: Buffer.from(JSON.stringify(sessionData)).toString('base64')
          })
        })
      }))
      
      const result = await validateShopifyAccess(request, SHOPIFY_RBAC.ADMIN_ONLY)
      
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(403)
    })

    it('should allow requests with sufficient permissions', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/test')
      
      // Mock cookies to return valid session with admin role
      const sessionData = {
        user_id: 'user-123',
        role: 'admin',
        username: 'admin',
        full_name: 'Admin User'
      }
      
      vi.mock('next/headers', () => ({
        cookies: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue({ 
            value: Buffer.from(JSON.stringify(sessionData)).toString('base64')
          })
        })
      }))
      
      const result = await validateShopifyAccess(request, SHOPIFY_RBAC.ADMIN_ONLY)
      
      expect(result).not.toBeInstanceOf(Response)
      expect(result).toHaveProperty('sessionData')
      expect((result as any).sessionData).toEqual(sessionData)
    })
  })

  describe('Role-based access control', () => {
    it('should allow admin access to all endpoints', async () => {
      const adminSession = {
        user_id: 'admin-123',
        role: 'admin',
        username: 'admin',
        full_name: 'Admin User'
      }

      // Test all role combinations
      expect(SHOPIFY_RBAC.ADMIN_ONLY.includes(adminSession.role)).toBe(true)
      expect(SHOPIFY_RBAC.ADMIN_LISTER.includes(adminSession.role)).toBe(true)
      expect(SHOPIFY_RBAC.ADMIN_LISTER_ANALYST.includes(adminSession.role)).toBe(true)
      expect(SHOPIFY_RBAC.ALL_ROLES.includes(adminSession.role)).toBe(true)
    })

    it('should allow lister access to appropriate endpoints', async () => {
      const listerSession = {
        user_id: 'lister-123',
        role: 'lister',
        username: 'lister',
        full_name: 'Lister User'
      }

      // Lister should not have admin-only access
      expect(SHOPIFY_RBAC.ADMIN_ONLY.includes(listerSession.role)).toBe(false)
      
      // But should have lister access
      expect(SHOPIFY_RBAC.ADMIN_LISTER.includes(listerSession.role)).toBe(true)
      expect(SHOPIFY_RBAC.ADMIN_LISTER_ANALYST.includes(listerSession.role)).toBe(true)
      expect(SHOPIFY_RBAC.ALL_ROLES.includes(listerSession.role)).toBe(true)
    })

    it('should allow analyst read-only access', async () => {
      const analystSession = {
        user_id: 'analyst-123',
        role: 'analyst',
        username: 'analyst',
        full_name: 'Analyst User'
      }

      // Analyst should not have write access
      expect(SHOPIFY_RBAC.ADMIN_ONLY.includes(analystSession.role)).toBe(false)
      expect(SHOPIFY_RBAC.ADMIN_LISTER.includes(analystSession.role)).toBe(false)
      
      // But should have read access
      expect(SHOPIFY_RBAC.ADMIN_LISTER_ANALYST.includes(analystSession.role)).toBe(true)
      expect(SHOPIFY_RBAC.ALL_ROLES.includes(analystSession.role)).toBe(true)
    })

    it('should allow viewer minimal access', async () => {
      const viewerSession = {
        user_id: 'viewer-123',
        role: 'viewer',
        username: 'viewer',
        full_name: 'Viewer User'
      }

      // Viewer should only have minimal access
      expect(SHOPIFY_RBAC.ADMIN_ONLY.includes(viewerSession.role)).toBe(false)
      expect(SHOPIFY_RBAC.ADMIN_LISTER.includes(viewerSession.role)).toBe(false)
      expect(SHOPIFY_RBAC.ADMIN_LISTER_ANALYST.includes(viewerSession.role)).toBe(false)
      
      // But should have basic access
      expect(SHOPIFY_RBAC.ALL_ROLES.includes(viewerSession.role)).toBe(true)
    })
  })
})
