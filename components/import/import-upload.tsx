"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"

interface ImportUploadProps {
  userId: string
}

export function ImportUpload({ userId }: ImportUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    sessionId?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setUploadResult(null)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "text/csv") {
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

    const supabase = createClient()

    try {
      // Read file content
      const fileContent = await file.text()
      const lines = fileContent.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row")
      }

      // Create import session
      const { data: session, error: sessionError } = await supabase
        .from("import_sessions")
        .insert([
          {
            user_id: userId,
            filename: file.name,
            file_size: file.size,
            total_records: lines.length - 1, // Exclude header
            status: "processing",
          },
        ])
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create import job
      const { error: jobError } = await supabase.from("job_queue").insert([
        {
          user_id: userId,
          job_type: "bulk_import",
          payload: {
            session_id: session.id,
            file_content: fileContent,
            filename: file.name,
          },
          priority: 1,
        },
      ])

      if (jobError) throw jobError

      setUploadResult({
        success: true,
        message: `Import started successfully! Processing ${lines.length - 1} records.`,
        sessionId: session.id,
      })

      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)
    } catch (error: unknown) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      })
    } finally {
      setIsUploading(false)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing your comic collection data. Make sure it follows the template format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          {file ? (
            <div className="space-y-2">
              <FileText className="h-12 w-12 mx-auto text-primary" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports CSV files up to 10MB</p>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {uploadResult && (
          <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : ""}>
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={uploadResult.success ? "text-green-700" : ""}>
              {uploadResult.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button onClick={handleUpload} disabled={!file || isUploading} className="flex-1">
            {isUploading ? "Processing..." : "Start Import"}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
