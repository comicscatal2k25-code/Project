import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionToken } from '@/lib/session-utils'

export async function POST(request: NextRequest) {
  try {
    const { username, password_hash } = await request.json()
    console.log('Login attempt:', { username, password_hash })

    if (!username || !password_hash) {
      console.log('Missing credentials')
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Call the authenticate function
    console.log('Calling authenticate_username_user with:', { p_username: username, p_password_hash: password_hash })
    const { data, error } = await supabase.rpc('authenticate_username_user', {
      p_username: username,
      p_password_hash: password_hash
    })

    console.log('Authentication result:', { data, error })

    if (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Authentication failed', details: error.message },
        { status: 401 }
      )
    }

    if (!data || data.length === 0) {
      console.log('No data returned from authentication')
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const user = data[0]

    // Create a session token with expiration
    const sessionToken = createSessionToken({
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    })

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    })

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
