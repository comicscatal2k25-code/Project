import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface SystemHealthProps {
  userId: string
}

export async function SystemHealth({ userId }: SystemHealthProps) {
  const supabase = await createClient()

  // Get system health metrics
  const { data: pendingJobs } = await supabase
    .from("job_queue")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "pending")

  const { data: failedJobs } = await supabase
    .from("job_queue")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "failed")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { data: shopifyConnection } = await supabase
    .from("shopify_settings")
    .select("is_active")
    .eq("user_id", userId)
    .single()

  const { data: recentImports } = await supabase
    .from("import_sessions")
    .select("status")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: comicsWithoutImages } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .is("cover_image_url", null)

  const { data: totalComics } = await supabase.from("comics").select("id", { count: "exact" }).eq("user_id", userId)

  const imageCompleteness = totalComics?.length
    ? Math.round(((totalComics.length - (comicsWithoutImages?.length || 0)) / totalComics.length) * 100)
    : 100

  const healthChecks = [
    {
      name: "Job Queue",
      status: (pendingJobs?.length || 0) < 10 && (failedJobs?.length || 0) < 5 ? "healthy" : "warning",
      details: `${pendingJobs?.length || 0} pending, ${failedJobs?.length || 0} failed`,
    },
    {
      name: "Shopify Integration",
      status: shopifyConnection?.is_active ? "healthy" : "inactive",
      details: shopifyConnection?.is_active ? "Connected and active" : "Not connected",
    },
    {
      name: "Data Completeness",
      status: imageCompleteness > 80 ? "healthy" : imageCompleteness > 50 ? "warning" : "error",
      details: `${imageCompleteness}% comics have cover images`,
    },
    {
      name: "Recent Imports",
      status: recentImports && recentImports.some((imp) => imp.status === "failed") ? "warning" : "healthy",
      details: `${recentImports?.length || 0} imports this week`,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Healthy
          </Badge>
        )
      case "warning":
        return <Badge variant="outline">Warning</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const overallHealth = healthChecks.every((check) => check.status === "healthy")
    ? "healthy"
    : healthChecks.some((check) => check.status === "error")
      ? "error"
      : "warning"

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Health
          {getStatusBadge(overallHealth)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthChecks.map((check, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{check.name}</h4>
              {getStatusBadge(check.status)}
            </div>
            <p className="text-xs text-muted-foreground">{check.details}</p>
          </div>
        ))}

        <div className="pt-4 border-t space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Collection Completeness</span>
              <span>{imageCompleteness}%</span>
            </div>
            <Progress value={imageCompleteness} className="h-2" />
          </div>

          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Run System Cleanup
            </Button>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Optimize Database
            </Button>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Generate Backup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
