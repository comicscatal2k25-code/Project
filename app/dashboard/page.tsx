import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentComics } from "@/components/dashboard/recent-comics"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome back, {data.user.user_metadata?.full_name || "Collector"}!
          </h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your comic collection</p>
        </div>

        <div className="grid gap-8">
          <DashboardStats userId={data.user.id} />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentComics userId={data.user.id} />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
