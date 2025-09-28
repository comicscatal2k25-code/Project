import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ComicsHeader } from "@/components/comics/comics-header"
import { ComicsGrid } from "@/components/comics/comics-grid"
import { ComicsFilters } from "@/components/comics/comics-filters"
import { ComicsStats } from "@/components/comics/comics-stats"
import { cookies } from "next/headers"

interface ComicsPageProps {
  searchParams: Promise<{
    search?: string
    condition?: string
    for_sale?: string
    publisher?: string
    shopify_synced?: string
    page?: string
  }>
}

export default async function ComicsPage({ searchParams }: ComicsPageProps) {
  const supabase = await createClient()
  const params = await searchParams

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

  return (
    <div className="min-h-screen bg-gray-50">
      <ComicsHeader />
      <ComicsStats userId={user.id} />
      <div className="container mx-auto px-6 py-8">
        {/* Horizontal Filters */}
        <div className="mb-8">
          <ComicsFilters />
        </div>
        
        {/* Comics Grid */}
        <ComicsGrid userId={user.id} searchParams={params} />
      </div>
    </div>
  )
}
