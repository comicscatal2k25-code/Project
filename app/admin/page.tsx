import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { CollectionOverview } from "@/components/admin/collection-overview"
import { ValueAnalytics } from "@/components/admin/value-analytics"
import { SystemHealth } from "@/components/admin/system-health"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <AdminHeader />

        <div className="mt-8 space-y-8">
          <AdminStats userId={data.user.id} />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <CollectionOverview userId={data.user.id} />
              <ValueAnalytics userId={data.user.id} />
            </div>
            <div>
              <SystemHealth userId={data.user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
