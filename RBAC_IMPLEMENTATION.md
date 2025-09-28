# Role-Based Access Control (RBAC) Implementation

This document describes the implementation of Role-Based Access Control (RBAC) in the Comic Catalog Manager application.

## Overview

The RBAC system provides fine-grained access control with four distinct roles:
- **Admin**: Full access to all features and settings
- **Lister**: Can add/edit comics and manage Shopify listings
- **Analyst**: Can view comics and run reports
- **Viewer**: Read-only access to comics catalog

## Feature Flag

The RBAC system is controlled by the `FEATURE_RBAC` environment variable:

- `FEATURE_RBAC=false` (default): Uses the legacy role system (admin/user)
- `FEATURE_RBAC=true`: Enables the full RBAC system

## Installation and Setup

### 1. Database Migration

Run the RBAC migration to set up the new schema:

```sql
-- Run the migration
\i scripts/030_rbac_migration_up.sql

-- Create initial admin user (optional)
\i scripts/031_create_initial_admin.sql
```

### 2. Environment Variables

Add the following environment variables to your `.env.local`:

```env
# Enable RBAC (default: false)
FEATURE_RBAC=true

# For client-side components
NEXT_PUBLIC_FEATURE_RBAC=true
```

### 3. Create Initial Admin User

After running the migration, create an initial admin user:

#### Option A: Using Supabase Dashboard
1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with the desired email
3. Run this SQL to promote them to admin:
```sql
SELECT promote_user_to_admin('admin@example.com');
```

#### Option B: Using the Admin UI
1. Enable RBAC (`FEATURE_RBAC=true`)
2. Log in with any existing user
3. If you have admin access, go to `/admin/users` to create new users
4. If you don't have admin access, use Option A

## Permission Matrix

| Resource | Action | Admin | Lister | Analyst | Viewer |
|----------|--------|-------|--------|---------|--------|
| Comics | Create | ✅ | ✅ | ❌ | ❌ |
| Comics | Read | ✅ | ✅ | ✅ | ✅ |
| Comics | Update | ✅ | ✅ | ❌ | ❌ |
| Comics | Delete | ✅ | ✅ | ❌ | ❌ |
| Import | Create | ✅ | ✅ | ❌ | ❌ |
| Export | Create | ✅ | ✅ | ❌ | ❌ |
| Reports | Read | ✅ | ✅ | ✅ | ❌ |
| Reports | Create | ✅ | ✅ | ✅ | ❌ |
| Settings | Read | ✅ | ✅ | ✅ | ✅ |
| Settings | Update | ✅ | ❌ | ❌ | ❌ |
| Users | Create | ✅ | ❌ | ❌ | ❌ |
| Users | Read | ✅ | ❌ | ❌ | ❌ |
| Users | Update | ✅ | ❌ | ❌ | ❌ |
| Users | Delete | ✅ | ❌ | ❌ | ❌ |
| Shopify | Create | ✅ | ✅ | ❌ | ❌ |
| Shopify | Read | ✅ | ✅ | ❌ | ❌ |
| Shopify | Update | ✅ | ✅ | ❌ | ❌ |
| Shopify | Delete | ✅ | ✅ | ❌ | ❌ |

## API Usage

### Server-Side RBAC

Use the `withRBAC` middleware to protect API routes:

```typescript
import { withRBAC } from '@/lib/rbac/middleware'

export const POST = withRBAC({
  requiredRole: 'admin',
  requiredPermissions: [{ resource: 'users', action: 'create' }]
})(async (request: NextRequest, { user, profile }) => {
  // Your API logic here
  // user and profile are automatically available
})
```

### Client-Side RBAC

Use the permission components to conditionally render UI:

```tsx
import { PermissionGuard } from '@/components/auth/role-guard'
import { PermissionButton } from '@/components/rbac/permission-button'
import { PermissionSection } from '@/components/rbac/permission-section'

// Hide/show content based on permissions
<PermissionGuard resource="comics" action="create">
  <AddComicButton />
</PermissionGuard>

// Disable button when no permission
<PermissionButton 
  resource="users" 
  action="create"
  onClick={handleCreateUser}
>
  Create User
</PermissionButton>

// Hide entire section
<PermissionSection 
  resource="settings" 
  action="update"
  title="System Settings"
>
  <SettingsForm />
</PermissionSection>
```

## Admin User Management

### Creating Users

Admins can create new users through the admin interface at `/admin/users`:

1. Click "Create User"
2. Fill in email, full name, password, and role
3. The user will be created and can log in immediately

### Managing Roles

Admins can change user roles:

1. Go to `/admin/users`
2. Click the edit button next to a user
3. Select the new role
4. Click "Update Role"

### User Deletion

Admins can delete users (except themselves):

1. Go to `/admin/users`
2. Click the delete button next to a user
3. Confirm the deletion

## Audit Logging

The system automatically logs important events:

- User creation and role changes
- Access denied attempts
- Import/export operations
- Comic management actions

View audit logs in the admin interface or query the `audit_logs` table directly.

## Backward Compatibility

When `FEATURE_RBAC=false`, the system maintains backward compatibility:

- Old `user` role is mapped to `lister`
- `admin` role remains unchanged
- Simple permission logic is used instead of database permissions

## Rollback

To rollback to the legacy system:

1. Set `FEATURE_RBAC=false` in environment variables
2. Run the rollback migration:
```sql
\i scripts/030_rbac_migration_down.sql
```

## Testing

Run the RBAC tests:

```bash
npm test -- __tests__/rbac/
```

The test suite covers:
- Permission matrix validation
- Middleware functionality
- Client-side auth behavior
- Integration scenarios

## Security Considerations

1. **Server-side validation**: All permission checks are enforced server-side
2. **Audit logging**: All sensitive operations are logged
3. **Role hierarchy**: Lower privilege roles cannot escalate permissions
4. **Admin bypass**: Admin role bypasses all permission checks
5. **Feature flag**: RBAC can be disabled without code changes

## Troubleshooting

### Common Issues

1. **"Access denied" errors**: Check if the user has the required role/permissions
2. **Sign-up blocked**: Verify `FEATURE_RBAC` is set correctly
3. **Permission checks failing**: Ensure the permissions table is populated
4. **Admin user not found**: Create an initial admin using the methods above

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_RBAC=true
```

This will log all permission checks and RBAC decisions to the console.

## Migration Checklist

- [ ] Run database migration (`030_rbac_migration_up.sql`)
- [ ] Set environment variables (`FEATURE_RBAC=true`)
- [ ] Create initial admin user
- [ ] Test user creation and role management
- [ ] Verify permission enforcement
- [ ] Test rollback procedure
- [ ] Update documentation for your team

## Support

For issues or questions about the RBAC implementation:

1. Check the audit logs for permission denials
2. Verify environment variables are set correctly
3. Ensure the database migration completed successfully
4. Test with different user roles to isolate the issue
