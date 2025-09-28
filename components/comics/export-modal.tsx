"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileText, CheckCircle, X } from "lucide-react"

interface ExportModalProps {
  userId: string
  currentFilters?: {
    search?: string
    condition?: string
    for_sale?: string
    publisher?: string
  }
}

export function ExportModal({ userId, currentFilters = {} }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
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
    sortBy: "title", // title, date_added, value, publisher
  })

  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)

    try {
      const exportData = {
        format: exportOptions.format,
        filterBy: exportOptions.filterBy,
        sortBy: exportOptions.sortBy,
        includeImages: exportOptions.includeImages,
        includePrivateNotes: exportOptions.includePrivateNotes,
        search: currentFilters.search || "",
        condition: currentFilters.condition || "all",
        publisher: currentFilters.publisher || "all"
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0]
      const extension = exportOptions.format === 'xlsx' ? 'xlsx' : exportOptions.format
      a.download = `shopify-comics-import-${timestamp}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportResult({
        success: true,
        message: `Shopify export completed successfully! Your ${exportOptions.format.toUpperCase()} file is ready for import to Shopify.`,
      })

    } catch (error) {
      console.error('Export error:', error)
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : "Export failed. Please try again.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const resetModal = () => {
    setExportResult(null)
    setExportOptions({
      format: "csv",
      includeImages: false,
      includePrivateNotes: true,
      filterBy: "all",
      sortBy: "title",
    })
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetModal()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Comics
          </DialogTitle>
          <DialogDescription>
            Export your comics in Shopify-compatible format for easy import to your store
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
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

          {/* Filter Options */}
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

          {/* Sort Options */}
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

          {/* Additional Options */}
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

          {/* Current Filters Info */}
          {(currentFilters.search || currentFilters.condition !== 'all' || currentFilters.publisher !== 'all') && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Current page filters will be applied:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {currentFilters.search && <li>• Search: "{currentFilters.search}"</li>}
                  {currentFilters.condition && currentFilters.condition !== 'all' && <li>• Condition: {currentFilters.condition}</li>}
                  {currentFilters.publisher && currentFilters.publisher !== 'all' && <li>• Publisher: {currentFilters.publisher}</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Result */}
          {exportResult && (
            <Alert className={exportResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CheckCircle className={`h-4 w-4 ${exportResult.success ? "text-green-600" : "text-red-600"}`} />
              <AlertDescription className={exportResult.success ? "text-green-700" : "text-red-700"}>
                {exportResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleExport} disabled={isExporting} className="flex-1">
              {isExporting ? "Preparing Export..." : "Start Export"}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
