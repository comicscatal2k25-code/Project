import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { withRBAC } from "@/lib/rbac/middleware"
import { logRoleChange } from "@/lib/rbac/audit"
import { UserRole } from "@/lib/auth-server"
import { cookies } from "next/headers"

/**
 * Update user role (Admin only)
 * PUT /api/admin/users/[id]
 */
export const PUT = withRBAC({
  requiredRole: 'admin',
  requiredPermissions: [{ resource: 'users', action: 'update' }]
})(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const userId = params.id
    const body = await request.json()
    const { role } = body

    // Validate input
    if (!role || !['admin', 'lister', 'analyst', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required. Must be one of: admin, lister, analyst, viewer' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current admin user for audit logging
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the current user's profile to check existing role
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (fetchError || !currentProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const oldRole = currentProfile.role

    // Update the user's role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: role as UserRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user role', details: updateError.message },
        { status: 500 }
      )
    }

    // Log the role change event
    await logRoleChange(
      adminUser.id,
      userId,
      oldRole,
      role,
      request.ip || request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: `User role updated from ${oldRole} to ${role}`
    })

  } catch (error) {
    console.error('Error in admin user role update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // Get session from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check if user is admin
    if (sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Prevent admin from deleting themselves
    if (sessionData.user_id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get user info before deletion for audit logging
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', userId)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the user from Supabase Auth using admin client
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      
      // If user not found in auth, just delete from profiles table
      if (deleteError.message.includes('User not found') || deleteError.code === 'user_not_found') {
        console.log('User not found in auth, deleting from profiles table only')
        const { error: profileDeleteError } = await adminSupabase
          .from('profiles')
          .delete()
          .eq('id', userId)
        
        if (profileDeleteError) {
          console.error('Error deleting profile:', profileDeleteError)
          return NextResponse.json(
            { error: 'Failed to delete user profile', details: profileDeleteError.message },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to delete user', details: deleteError.message },
          { status: 500 }
        )
      }
    }

    // Log the user deletion event
    await logRoleChange(
      sessionData.user_id,
      userId,
      userProfile?.role || 'unknown',
      'deleted',
      request.ip || request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error in admin user deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
