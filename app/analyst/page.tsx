import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AnalystDashboard } from "@/components/analyst/analyst-dashboard"

export default async function AnalystPage() {
  // Check session and role
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    redirect("/auth/login")
  }

  let sessionData
  try {
    sessionData = JSON.parse(atob(sessionToken))
  } catch (error) {
    redirect("/auth/login")
  }

  // Check if user has analyst role or higher
  if (!['admin', 'analyst'].includes(sessionData.role)) {
    redirect("/comics")
  }

  return <AnalystDashboard />
}
