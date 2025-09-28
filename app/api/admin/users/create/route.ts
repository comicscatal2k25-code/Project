import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password, full_name, role } = await request.json()

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'lister', 'analyst', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Hash the password (in production, use bcrypt or similar)
    const passwordHash = btoa(password)

    // Call the create user function
    const { data: userId, error } = await supabase.rpc('create_username_user', {
      p_username: username,
      p_password_hash: passwordHash,
      p_full_name: full_name || null,
      p_role: role
    })

    if (error) {
      console.error('User creation error:', error)
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Log the user creation event
    await supabase.rpc('log_audit_event', {
      p_actor_user_id: null, // Will be set by the function
      p_action: 'user_created',
      p_resource: 'users',
      p_outcome: 'success',
      p_target_user_id: userId,
      p_metadata: JSON.stringify({
        username,
        role,
        full_name
      })
    })

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        full_name,
        role
      }
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
