"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, CheckCircle } from "lucide-react"

interface ExportOptionsProps {
  userId: string
}

export function ExportOptions({ userId }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    success: boolean
    message: string
    downloadUrl?: string
  } | null>(null)

  const [exportOptions, setExportOptions] = useState({
    format: "csv",
    includeImages: false,
    includePrivateNotes: true,
    filterBy: "all", // all, for_sale, not_for_sale
    sortBy: "title", // title, date_added, value
  })

  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)

    const supabase = createClient()

    try {
      // Create export job
      const { error: jobError } = await supabase.from("job_queue").insert([
        {
          user_id: userId,
          job_type: "bulk_export",
          payload: {
            format: exportOptions.format,
            options: exportOptions,
          },
          priority: 1,
        },
      ])

      if (jobError) throw jobError

      // For demo purposes, simulate export completion
      setTimeout(() => {
        setExportResult({
          success: true,
          message: "Export completed successfully! Your file is ready for download.",
          downloadUrl: `/api/export/download?format=${exportOptions.format}&user=${userId}`,
        })
        setIsExporting(false)
      }, 3000)
    } catch (error: unknown) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      })
      setIsExporting(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Options
        </CardTitle>
        <CardDescription>Configure your export settings and download your collection data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value) => setExportOptions({ ...exportOptions, format: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filter Comics</Label>
            <Select
              value={exportOptions.filterBy}
              onValueChange={(value) => setExportOptions({ ...exportOptions, filterBy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Comics</SelectItem>
                <SelectItem value="for_sale">For Sale Only</SelectItem>
                <SelectItem value="not_for_sale">Not For Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select
            value={exportOptions.sortBy}
            onValueChange={(value) => setExportOptions({ ...exportOptions, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="date_added">Date Added (Newest First)</SelectItem>
              <SelectItem value="value">Current Value (Highest First)</SelectItem>
              <SelectItem value="publisher">Publisher (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Additional Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeImages"
                checked={exportOptions.includeImages}
                onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeImages: checked as boolean })}
              />
              <Label htmlFor="includeImages" className="text-sm">
                Include cover image URLs
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePrivateNotes"
                checked={exportOptions.includePrivateNotes}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includePrivateNotes: checked as boolean })
                }
              />
              <Label htmlFor="includePrivateNotes" className="text-sm">
                Include private notes and locations
              </Label>
            </div>
          </div>
        </div>

        {exportResult && (
          <Alert className={exportResult.success ? "border-green-200 bg-green-50" : ""}>
            <CheckCircle className={`h-4 w-4 ${exportResult.success ? "text-green-600" : ""}`} />
            <AlertDescription className={exportResult.success ? "text-green-700" : ""}>
              {exportResult.message}
              {exportResult.downloadUrl && (
                <div className="mt-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={exportResult.downloadUrl} download>
                      <FileText className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleExport} disabled={isExporting} className="w-full">
          {isExporting ? "Preparing Export..." : "Start Export"}
        </Button>
      </CardContent>
    </Card>
  )
}
