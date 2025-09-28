import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface JobsStatsProps {
  userId: string
}

export async function JobsStats({ userId }: JobsStatsProps) {
  const supabase = await createClient()

  // Get job statistics
  const { data: pendingJobs } = await supabase
    .from("job_queue")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "pending")

  const { data: processingJobs } = await supabase
    .from("job_queue")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "processing")

  const { data: completedJobs } = await supabase
    .from("job_queue")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { data: failedJobs } = await supabase
    .from("job_queue")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "failed")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const stats = [
    {
      title: "Pending",
      value: pendingJobs?.length || 0,
      icon: "⏳",
      description: "Waiting to process",
    },
    {
      title: "Processing",
      value: processingJobs?.length || 0,
      icon: "⚡",
      description: "Currently running",
    },
    {
      title: "Completed",
      value: completedJobs?.length || 0,
      icon: "✅",
      description: "Last 24 hours",
    },
    {
      title: "Failed",
      value: failedJobs?.length || 0,
      icon: "❌",
      description: "Last 24 hours",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
