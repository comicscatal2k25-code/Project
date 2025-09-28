import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportHistoryProps {
  userId: string
}

export function ExportHistory({ userId }: ExportHistoryProps) {
  // Mock data for export history
  const exportHistory = [
    {
      id: "1",
      filename: "comics-export-2024-01-15.csv",
      format: "CSV",
      recordCount: 1250,
      status: "completed",
      createdAt: "2024-01-15T10:30:00Z",
      downloadUrl: "/api/export/download/1",
    },
    {
      id: "2",
      filename: "for-sale-comics-2024-01-10.xlsx",
      format: "Excel",
      recordCount: 89,
      status: "completed",
      createdAt: "2024-01-10T14:22:00Z",
      downloadUrl: "/api/export/download/2",
    },
    {
      id: "3",
      filename: "collection-backup-2024-01-05.json",
      format: "JSON",
      recordCount: 1250,
      status: "failed",
      createdAt: "2024-01-05T09:15:00Z",
    },
  ]

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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Export History</CardTitle>
      </CardHeader>
      <CardContent>
        {exportHistory.length > 0 ? (
          <div className="space-y-4">
            {exportHistory.map((export_) => (
              <div key={export_.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{export_.filename}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(export_.createdAt).toLocaleDateString()} • {export_.recordCount} records
                    </p>
                  </div>
                  {getStatusBadge(export_.status)}
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {export_.format}
                  </Badge>
                  {export_.status === "completed" && export_.downloadUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={export_.downloadUrl} download>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📤</span>
            <p className="text-muted-foreground">No export history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
