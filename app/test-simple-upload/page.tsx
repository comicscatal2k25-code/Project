"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function TestSimpleUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const testDirectUpload = async () => {
    if (!file) {
      setResult({ error: "Please select a file first." })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()
      console.log("Supabase client created:", supabase)
      console.log("Environment variables:", {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing"
      })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log("Auth result:", { user: user?.id, error: authError })
      
      if (authError || !user) {
        setResult({ error: "Not authenticated: " + (authError?.message || "No user") })
        return
      }

      // Test 1: Try to upload directly (skip bucket listing)
      console.log("Attempting direct upload to comic-images bucket...")
      const fileName = `test-${Date.now()}.${file.name.split('.').pop()}`
      const filePath = `test-uploads/${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comic-images')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        setResult({ 
          error: "Upload failed: " + uploadError.message,
          details: {
            error: uploadError,
            fileName: fileName,
            filePath: filePath
          }
        })
        return
      }

      // Test 3: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('comic-images')
        .getPublicUrl(filePath)

      setResult({
        success: true,
        message: "Upload successful!",
        data: {
          fileName: fileName,
          filePath: filePath,
          publicUrl: publicUrl,
          uploadData: uploadData
        }
      })

    } catch (error: any) {
      setResult({ error: "Unexpected error: " + error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Simple Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="imageFile">Image File</Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <Button 
              onClick={testDirectUpload} 
              disabled={loading || !file} 
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? "Testing..." : "Test Direct Upload"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? "text-green-600" : "text-red-600"}>
                Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
