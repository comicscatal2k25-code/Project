import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface RecentSyncsProps {
  userId: string
}

export async function RecentSyncs({ userId }: RecentSyncsProps) {
  const supabase = await createClient()

  const { data: recentSyncs } = await supabase
    .from("shopify_sync_logs")
    .select(`
      id,
      operation,
      status,
      error_message,
      created_at,
      comics (title, issue_number)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case "create":
        return "Created"
      case "update":
        return "Updated"
      case "delete":
        return "Deleted"
      case "bulk_import":
        return "Bulk Import"
      case "bulk_export":
        return "Bulk Export"
      default:
        return operation
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Recent Sync Activity</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/shopify/history">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentSyncs && recentSyncs.length > 0 ? (
          <div className="space-y-4">
            {recentSyncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{getOperationLabel(sync.operation)}</span>
                    {getStatusBadge(sync.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sync.comics?.title}
                    {sync.comics?.issue_number && ` #${sync.comics.issue_number}`}
                  </p>
                  {sync.error_message && <p className="text-xs text-destructive mt-1">{sync.error_message}</p>}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(sync.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">🔄</span>
            <p className="text-muted-foreground mb-4">No sync activity yet</p>
            <p className="text-sm text-muted-foreground">Start syncing your comics to see activity here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
