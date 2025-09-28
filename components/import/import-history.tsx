import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ImportHistoryProps {
  userId: string
}

export async function ImportHistory({ userId }: ImportHistoryProps) {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("import_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

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
      case "processing":
        return <Badge variant="outline">Processing</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Import History</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => {
              const progressPercentage = session.total_records
                ? Math.round((session.processed_records / session.total_records) * 100)
                : 0

              return (
                <div key={session.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{session.filename}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()} •{" "}
                        {((session.file_size || 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-medium">{session.total_records}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success:</span>
                      <span className="ml-1 font-medium text-green-600">{session.successful_records}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Failed:</span>
                      <span className="ml-1 font-medium text-red-600">{session.failed_records}</span>
                    </div>
                  </div>

                  {session.status === "processing" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  )}

                  {session.error_log && Object.keys(session.error_log).length > 0 && (
                    <div className="text-xs">
                      <details className="cursor-pointer">
                        <summary className="text-destructive">View Errors</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(session.error_log, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📥</span>
            <p className="text-muted-foreground">No import history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
