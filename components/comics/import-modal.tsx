"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from "lucide-react"

interface ImportModalProps {
  userId: string
}

export function ImportModal({ userId }: ImportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    importedCount?: number
    skippedCount?: number
    updatedCount?: number
    errorCount?: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile)
      setUploadResult(null)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile)
      setUploadResult(null)
    } else {
      alert("Please drop a valid CSV file")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResult(null)

    try {
      // Read file content
      const fileContent = await file.text()
      const lines = fileContent.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row")
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || ''
        })
        return row
      })

      console.log("Parsed CSV:", { headers, dataRows })

      // Send to import API
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          filename: file.name,
          data: dataRows,
          headers
        }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      setTimeout(() => {
        setUploadResult({
          success: true,
          message: `Import completed successfully!`,
          importedCount: result.importedCount || 0,
          skippedCount: result.skippedCount || 0,
          updatedCount: result.updatedCount || 0,
          errorCount: result.errorCount || 0
        })
        setIsUploading(false)
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)

    } catch (error) {
      console.error('Import error:', error)
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Import failed. Please try again.",
      })
      setIsUploading(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setUploadResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetModal()
    }
  }

  const downloadTemplate = () => {
    const templateHeaders = [
      'title',
      'issue_number',
      'series',
      'publisher',
      'era',
      'condition',
      'grade',
      'grading_service',
      'current_value',
      'acquired_price',
      'compare_at_price',
      'inventory_quantity',
      'for_sale',
      'is_key_issue',
      'key_issue_notes',
      'tags',
      'handle',
      'product_type',
      'vendor',
      'barcode',
      'body_html'
    ]

    const csvContent = [
      templateHeaders.join(','),
      'The Amazing Spider-Man,121,The Amazing Spider-Man,Marvel Comics,Silver Age,Near Mint,9.4,CGC,150.00,75.00,200.00,2,true,true,First appearance of Green Goblin,"superhero,marvel,spider-man",amazing-spider-man-121,Comic Book,Marvel Comics,123456789012,A collectible comic book in Near Mint condition.'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comics-import-template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Importing..." : "Import"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Comics
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import your comic collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Template
              </CardTitle>
              <CardDescription>
                Download our CSV template to ensure proper formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload CSV File</CardTitle>
              <CardDescription>
                Select or drag and drop your CSV file here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-green-500" />
                    <p className="text-lg font-medium text-green-600">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-lg font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing comics...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {uploadResult && (
            <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={uploadResult.success ? "text-green-700" : "text-red-700"}>
                {uploadResult.message}
                {uploadResult.success && (uploadResult.importedCount || uploadResult.skippedCount || uploadResult.errorCount) && (
                  <div className="mt-2 text-sm">
                    {uploadResult.importedCount && uploadResult.importedCount > 0 && (
                      <div>• Imported: {uploadResult.importedCount} comics</div>
                    )}
                    {uploadResult.skippedCount && uploadResult.skippedCount > 0 && (
                      <div>• Skipped: {uploadResult.skippedCount} duplicates</div>
                    )}
                    {uploadResult.updatedCount && uploadResult.updatedCount > 0 && (
                      <div>• Updated: {uploadResult.updatedCount} comics</div>
                    )}
                    {uploadResult.errorCount && uploadResult.errorCount > 0 && (
                      <div>• Errors: {uploadResult.errorCount} records</div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading} 
              className="flex-1"
            >
              {isUploading ? "Importing..." : "Start Import"}
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
