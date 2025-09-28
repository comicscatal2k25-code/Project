import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JobsHeader } from "@/components/jobs/jobs-header"
import { JobsStats } from "@/components/jobs/jobs-stats"
import { JobsQueue } from "@/components/jobs/jobs-queue"
import { JobsHistory } from "@/components/jobs/jobs-history"

export default async function JobsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <JobsHeader />

        <div className="mt-8 space-y-8">
          <JobsStats userId={data.user.id} />
          <div className="grid lg:grid-cols-2 gap-8">
            <JobsQueue userId={data.user.id} />
            <JobsHistory userId={data.user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
