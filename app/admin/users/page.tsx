import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminUsersPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage user accounts and roles
          </p>
        </div>

        <UserManagement />
      </div>
    </div>
  )
}
