import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
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

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify current password by attempting to authenticate
    const { data: authData, error: authError } = await supabase.rpc('authenticate_username_user', {
      p_username: sessionData.username,
      p_password_hash: btoa(currentPassword) // Base64 encode the password
    })

    if (authError || !authData || authData.length === 0) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Update the password
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        password_hash: btoa(newPassword), // Base64 encode the new password
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionData.user_id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
