import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Create a new user (Admin only)
 * POST /api/admin/users
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/users - Starting request')
    
    // Get session from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    console.log('Session token found:', !!sessionToken)
    
    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
      console.log('Session data parsed:', { role: sessionData.role, username: sessionData.username })
    } catch (error) {
      console.log('Error parsing session token:', error)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check if user is admin
    if (sessionData.role !== 'admin') {
      console.log('User is not admin, role:', sessionData.role)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, fullName, role = 'viewer' } = body

    console.log('Creating user with data:', { username, fullName, role, passwordLength: password?.length })

    // Validate input
    if (!username || !password || !fullName) {
      console.log('Validation failed:', { username: !!username, password: !!password, fullName: !!fullName })
      return NextResponse.json(
        { error: 'Username, password, and full name are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'lister', 'analyst', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, lister, analyst, viewer' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    console.log('Creating Supabase client...')
    const supabase = await createClient()
    console.log('Supabase client created successfully')

    // Check if username already exists
    console.log('Checking if username exists...')
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking username:', checkError)
      return NextResponse.json(
        { error: 'Failed to check username', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('Username already exists')
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Generate a unique UUID
    const newUserId = crypto.randomUUID()
    console.log('Generated UUID:', newUserId)

    // Create user in profiles table only
    console.log('Creating user in profiles table...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUserId,
        user_id: newUserId,
        username: username,
        password_hash: btoa(password),
        full_name: fullName,
        role: role,
        email: `${username}@local.com`
      })
      .select('id, username, full_name, role, created_at')
      .single()

    console.log('Profile creation result:', { profileData, profileError })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    const newUser = profileData
    console.log('User created successfully:', newUser)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
        created_at: newUser.created_at
      },
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Error in admin user creation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/users - Starting request')
    
    // Get session from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    console.log('Session token found:', !!sessionToken)
    
    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
      console.log('Session data parsed:', { role: sessionData.role, username: sessionData.username })
    } catch (error) {
      console.log('Error parsing session token:', error)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Check if user is admin
    if (sessionData.role !== 'admin') {
      console.log('User is not admin, role:', sessionData.role)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('Creating Supabase client...')
    const supabase = await createClient()
    console.log('Supabase client created successfully')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    console.log('Querying profiles table...')
    // Get users with their profiles (username-based)
    const { data: profiles, error, count } = await supabase
      .from('profiles')
      .select('id, username, full_name, role, created_at, updated_at', { count: 'exact' })
      .not('username', 'is', null) // Only get username-based users
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    console.log('Query result:', { profiles: profiles?.length, error, count })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: profiles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in admin user listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
