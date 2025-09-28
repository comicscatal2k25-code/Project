import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function HomePage() {
  // Check for username-based session
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (sessionToken) {
    // User is authenticated, redirect to comics catalog
    redirect("/comics")
  } else {
    // User is not authenticated, redirect to login
    redirect("/auth/login")
  }
}
