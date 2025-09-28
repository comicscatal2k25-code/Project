"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, X, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  comicId: string
  currentImageUrl?: string | null
  onImageUploaded?: (imageUrl: string, comicId?: string) => void
  onImageRemoved?: () => void
}

export function ImageUpload({ comicId, currentImageUrl, onImageUploaded, onImageRemoved }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)

  // Update imageUrl when currentImageUrl prop changes
  useEffect(() => {
    setImageUrl(currentImageUrl || null)
  }, [currentImageUrl])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log("No file selected")
      return
    }

    console.log("=== ImageUpload: Starting upload ===")
    console.log("File:", file.name, file.size, file.type)
    console.log("Comic ID:", comicId)
    console.log("Current imageUrl:", imageUrl)

    setUploading(true)
    setError(null)
    
    try {
      // Use direct Supabase upload instead of API route
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error("Not authenticated: " + (authError?.message || "No user"))
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.")
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 10MB.")
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${comicId}-${Date.now()}.${fileExt}`
      const filePath = `comic-covers/${user.id}/${fileName}`

      console.log("Uploading directly to Supabase Storage...")
      console.log("File path:", filePath)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comic-images')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw new Error("Upload failed: " + uploadError.message)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('comic-images')
        .getPublicUrl(filePath)

      console.log("Upload successful! Public URL:", publicUrl)

      setImageUrl(publicUrl)
      onImageUploaded?.(publicUrl, comicId)
      console.log("ImageUpload: Upload completed successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!imageUrl) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error("Not authenticated: " + (authError?.message || "No user"))
      }

      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-3).join('/') // Get the last 3 parts (bucket/user/filename)
      
      console.log("Removing image from path:", filePath)

      // Remove from storage
      const { error: removeError } = await supabase.storage
        .from('comic-images')
        .remove([filePath])

      if (removeError) {
        console.error("Remove error:", removeError)
        throw new Error("Failed to remove image: " + removeError.message)
      }

      setImageUrl(null)
      onImageRemoved?.()
      console.log("Image removed successfully!")
    } catch (error) {
      console.error("Error removing image:", error)
      setError(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="comic-panel bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="comic-heading text-lg text-gray-900">Comic Cover Image</h3>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="comic-body text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {imageUrl ? (
            <div className="space-y-4">
              <div className="comic-cover aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg">
                <img 
                  src={imageUrl} 
                  alt="Comic cover" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error("Image failed to load:", imageUrl)
                    setError("Failed to load image. Please try uploading again.")
                    setImageUrl(null)
                  }}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleRemoveImage}
                disabled={uploading}
                className="comic-button w-full bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white border-2 border-red-600"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Removing...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Remove Image
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="comic-panel border-2 border-dashed border-gray-400 rounded-lg p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="comic-body text-gray-700 mb-4">Upload a cover image for this comic</p>
              <p className="comic-body text-xs text-gray-500 mb-4">Supports JPEG, PNG, WebP (max 10MB)</p>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <Button 
                asChild 
                disabled={uploading}
                className="comic-button bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-white border-2 border-yellow-600 shadow-lg"
              >
                <label htmlFor="image-upload" className="cursor-pointer">
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </>
                  )}
                </label>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
