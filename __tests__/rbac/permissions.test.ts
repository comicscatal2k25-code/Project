import { hasPermission, getRolePermissions, getRolesWithPermission, PERMISSION_CHECKS } from '@/lib/rbac/permissions'
import { UserRole } from '@/lib/auth-server'

describe('RBAC Permissions', () => {
  describe('hasPermission', () => {
    it('should return true for admin with any permission', () => {
      expect(hasPermission('admin', 'comics', 'create')).toBe(true)
      expect(hasPermission('admin', 'users', 'delete')).toBe(true)
      expect(hasPermission('admin', 'settings', 'update')).toBe(true)
    })

    it('should return true for lister with comics permissions', () => {
      expect(hasPermission('lister', 'comics', 'create')).toBe(true)
      expect(hasPermission('lister', 'comics', 'update')).toBe(true)
      expect(hasPermission('lister', 'comics', 'delete')).toBe(true)
    })

    it('should return false for lister with user management permissions', () => {
      expect(hasPermission('lister', 'users', 'create')).toBe(false)
      expect(hasPermission('lister', 'users', 'update')).toBe(false)
    })

    it('should return true for analyst with read permissions', () => {
      expect(hasPermission('analyst', 'comics', 'read')).toBe(true)
      expect(hasPermission('analyst', 'reports', 'read')).toBe(true)
    })

    it('should return false for analyst with write permissions', () => {
      expect(hasPermission('analyst', 'comics', 'create')).toBe(false)
      expect(hasPermission('analyst', 'comics', 'update')).toBe(false)
    })

    it('should return true for viewer with read permissions only', () => {
      expect(hasPermission('viewer', 'comics', 'read')).toBe(true)
      expect(hasPermission('viewer', 'settings', 'read')).toBe(true)
    })

    it('should return false for viewer with write permissions', () => {
      expect(hasPermission('viewer', 'comics', 'create')).toBe(false)
      expect(hasPermission('viewer', 'reports', 'create')).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const permissions = getRolePermissions('admin')
      expect(permissions.comics).toContain('create')
      expect(permissions.comics).toContain('read')
      expect(permissions.comics).toContain('update')
      expect(permissions.comics).toContain('delete')
      expect(permissions.users).toContain('create')
      expect(permissions.users).toContain('delete')
    })

    it('should return limited permissions for lister', () => {
      const permissions = getRolePermissions('lister')
      expect(permissions.comics).toContain('create')
      expect(permissions.comics).toContain('read')
      expect(permissions.comics).toContain('update')
      expect(permissions.comics).toContain('delete')
      expect(permissions.users).toBeUndefined()
    })

    it('should return read-only permissions for analyst', () => {
      const permissions = getRolePermissions('analyst')
      expect(permissions.comics).toEqual(['read'])
      expect(permissions.reports).toContain('read')
      expect(permissions.reports).toContain('create')
    })

    it('should return minimal permissions for viewer', () => {
      const permissions = getRolePermissions('viewer')
      expect(permissions.comics).toEqual(['read'])
      expect(permissions.settings).toEqual(['read'])
    })
  })

  describe('getRolesWithPermission', () => {
    it('should return all roles for comics read permission', () => {
      const roles = getRolesWithPermission('comics', 'read')
      expect(roles).toContain('admin')
      expect(roles).toContain('lister')
      expect(roles).toContain('analyst')
      expect(roles).toContain('viewer')
    })

    it('should return only admin and lister for comics create permission', () => {
      const roles = getRolesWithPermission('comics', 'create')
      expect(roles).toContain('admin')
      expect(roles).toContain('lister')
      expect(roles).not.toContain('analyst')
      expect(roles).not.toContain('viewer')
    })

    it('should return only admin for users create permission', () => {
      const roles = getRolesWithPermission('users', 'create')
      expect(roles).toEqual(['admin'])
    })
  })

  describe('PERMISSION_CHECKS', () => {
    it('should allow admin to manage comics', () => {
      expect(PERMISSION_CHECKS.canManageComics('admin')).toBe(true)
    })

    it('should allow lister to manage comics', () => {
      expect(PERMISSION_CHECKS.canManageComics('lister')).toBe(true)
    })

    it('should not allow analyst to manage comics', () => {
      expect(PERMISSION_CHECKS.canManageComics('analyst')).toBe(false)
    })

    it('should not allow viewer to manage comics', () => {
      expect(PERMISSION_CHECKS.canManageComics('viewer')).toBe(false)
    })

    it('should allow all roles to view comics', () => {
      expect(PERMISSION_CHECKS.canViewComics('admin')).toBe(true)
      expect(PERMISSION_CHECKS.canViewComics('lister')).toBe(true)
      expect(PERMISSION_CHECKS.canViewComics('analyst')).toBe(true)
      expect(PERMISSION_CHECKS.canViewComics('viewer')).toBe(true)
    })

    it('should only allow admin to manage users', () => {
      expect(PERMISSION_CHECKS.canManageUsers('admin')).toBe(true)
      expect(PERMISSION_CHECKS.canManageUsers('lister')).toBe(false)
      expect(PERMISSION_CHECKS.canManageUsers('analyst')).toBe(false)
      expect(PERMISSION_CHECKS.canManageUsers('viewer')).toBe(false)
    })

    it('should allow admin and lister to import/export', () => {
      expect(PERMISSION_CHECKS.canImportExport('admin')).toBe(true)
      expect(PERMISSION_CHECKS.canImportExport('lister')).toBe(true)
      expect(PERMISSION_CHECKS.canImportExport('analyst')).toBe(false)
      expect(PERMISSION_CHECKS.canImportExport('viewer')).toBe(false)
    })

    it('should allow admin, lister, and analyst to run reports', () => {
      expect(PERMISSION_CHECKS.canRunReports('admin')).toBe(true)
      expect(PERMISSION_CHECKS.canRunReports('lister')).toBe(true)
      expect(PERMISSION_CHECKS.canRunReports('analyst')).toBe(true)
      expect(PERMISSION_CHECKS.canRunReports('viewer')).toBe(false)
    })
  })
})
