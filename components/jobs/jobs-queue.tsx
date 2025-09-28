import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface JobsQueueProps {
  userId: string
}

export async function JobsQueue({ userId }: JobsQueueProps) {
  const supabase = await createClient()

  const { data: activeJobs } = await supabase
    .from("job_queue")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "processing"])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10)

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
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Processing
          </Badge>
        )
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

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return <Badge variant="destructive">High</Badge>
    if (priority >= 1) return <Badge variant="secondary">Normal</Badge>
    return <Badge variant="outline">Low</Badge>
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Active Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        {activeJobs && activeJobs.length > 0 ? (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{getJobTypeLabel(job.job_type)}</h4>
                    <p className="text-sm text-muted-foreground">Created {new Date(job.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(job.priority)}
                    {getStatusBadge(job.status)}
                  </div>
                </div>

                {job.status === "processing" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>Processing...</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Attempts:</span>
                    <span className="ml-1 font-medium">
                      {job.attempts}/{job.max_attempts}
                    </span>
                  </div>
                  {job.scheduled_at && new Date(job.scheduled_at) > new Date() && (
                    <div>
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="ml-1 font-medium">{new Date(job.scheduled_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {job.error_message && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{job.error_message}</div>
                )}

                {job.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Cancel
                    </Button>
                    <Button size="sm" variant="outline">
                      Retry Now
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">⚡</span>
            <p className="text-muted-foreground">No active jobs</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
