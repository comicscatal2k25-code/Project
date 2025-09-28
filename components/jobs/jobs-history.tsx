import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface JobsHistoryProps {
  userId: string
}

export async function JobsHistory({ userId }: JobsHistoryProps) {
  const supabase = await createClient()

  const { data: completedJobs } = await supabase
    .from("job_queue")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["completed", "failed", "cancelled"])
    .order("completed_at", { ascending: false })
    .limit(20)

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case "shopify_sync":
        return "Shopify Sync"
      case "bulk_import":
        return "Bulk Import"
      case "bulk_export":
        return "Bulk Export"
      case "image_processing":
        return "Image Processing"
      case "data_cleanup":
        return "Data Cleanup"
      default:
        return jobType
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Completed
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return "N/A"
    const start = new Date(startedAt)
    const end = new Date(completedAt)
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Job History</CardTitle>
        <Button variant="outline" size="sm">
          Clear History
        </Button>
      </CardHeader>
      <CardContent>
        {completedJobs && completedJobs.length > 0 ? (
          <div className="space-y-4">
            {completedJobs.map((job) => (
              <div key={job.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{getJobTypeLabel(job.job_type)}</h4>
                    <p className="text-xs text-muted-foreground">
                      {job.completed_at
                        ? `Completed ${new Date(job.completed_at).toLocaleString()}`
                        : `Created ${new Date(job.created_at).toLocaleString()}`}
                    </p>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>Duration: {getDuration(job.started_at, job.completed_at)}</div>
                  <div>Attempts: {job.attempts}</div>
                </div>

                {job.error_message && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{job.error_message}</div>
                )}

                {job.result && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">View Result</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(job.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-muted-foreground">No job history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
