import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminSettings } from "@/components/admin/admin-settings"

export default async function AdminSettingsPage() {
  // Check for username-based session
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    redirect("/auth/login")
  }

  // Parse the session token
  let user
  try {
    const sessionData = JSON.parse(atob(sessionToken))
    user = {
      id: sessionData.user_id,
      username: sessionData.username,
      role: sessionData.role
    }
  } catch (error) {
    console.error('Error parsing session token:', error)
    redirect("/auth/login")
  }

  // Check if user is admin
  if (user.role !== 'admin') {
    redirect("/comics")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="comic-title text-4xl text-gray-900 mb-2">Admin Settings</h1>
          <p className="comic-body text-gray-600 text-lg">Manage your account and system settings</p>
        </div>

        <AdminSettings user={user} />
      </div>
    </div>
  )
}
