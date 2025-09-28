"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [comicId, setComicId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setFile(selectedFile || null)
  }

  const handleUpload = async () => {
    if (!file || !comicId) {
      alert("Please select a file and enter a comic ID")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('comicId', comicId)

      console.log("Uploading file:", file.name, "for comic:", comicId)

      const response = await fetch('/api/upload-image-simple', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log("Upload response:", data)
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      console.error("Upload error:", error)
      setResult({
        error: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Image Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comic-id">Comic ID (use an existing comic ID)</Label>
              <Input
                id="comic-id"
                value={comicId}
                onChange={(e) => setComicId(e.target.value)}
                placeholder="Enter a comic ID"
              />
            </div>

            <div>
              <Label htmlFor="file">Select Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={loading || !file || !comicId}
              className="w-full"
            >
              {loading ? "Uploading..." : "Upload Image"}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>First, save a comic to get a comic ID</li>
                <li>Copy that comic ID and paste it above</li>
                <li>Select an image file (JPEG, PNG, WebP)</li>
                <li>Click "Upload Image"</li>
                <li>Check the result and browser console for details</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
