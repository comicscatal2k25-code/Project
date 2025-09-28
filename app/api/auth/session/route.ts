import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSessionToken } from '@/lib/session-utils'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    console.log('Session API called, token exists:', !!sessionToken)

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Validate the session token
    console.log('Validating session token...')
    const validation = validateSessionToken(sessionToken)
    
    if (!validation.valid) {
      console.log('Session validation failed:', validation.error)
      return NextResponse.json(
        { error: validation.error || 'Invalid session' },
        { status: 401 }
      )
    }
    
    console.log('Returning user data:', validation.user)
    return NextResponse.json(validation.user)

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}
