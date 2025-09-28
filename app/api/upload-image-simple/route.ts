import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Simple upload route that tries to work around RLS issues
export async function POST(request: NextRequest) {
  try {
    console.log("=== Simple Image Upload API Called ===")
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("User authenticated:", user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const comicId = formData.get('comicId') as string

    console.log("File received:", file?.name, file?.size, file?.type)
    console.log("Comic ID:", comicId)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!comicId || comicId === "new") {
      return NextResponse.json({ error: "Comic must be saved before uploading images" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." 
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 10MB." 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${comicId}-${Date.now()}.${fileExt}`
    const filePath = `comic-covers/${user.id}/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log("Attempting to upload to path:", filePath)
    
    // Try to upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comic-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    console.log("Upload result:", { uploadData, uploadError })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      
      // If it's an RLS policy error, provide specific guidance
      if (uploadError.message.includes('row-level security policy')) {
        return NextResponse.json({ 
          error: "Storage bucket RLS policy error. Please make the 'comic-images' bucket public in your Supabase dashboard.",
          details: uploadError.message,
          fix: "Go to Supabase Dashboard → Storage → Buckets → comic-images → Toggle 'Public bucket' ON"
        }, { status: 500 })
      }
      
      // Provide more specific error messages
      let errorMessage = "Failed to upload image"
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = "Storage bucket 'comic-images' not found. Please create it in your Supabase dashboard."
      } else if (uploadError.message.includes('permission')) {
        errorMessage = "Permission denied. Please check your storage policies."
      } else if (uploadError.message.includes('size')) {
        errorMessage = "File too large or invalid format."
      } else if (uploadError.message.includes('JWT')) {
        errorMessage = "Authentication error. Please try logging out and back in."
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: uploadError.message,
        code: uploadError.statusCode
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('comic-images')
      .getPublicUrl(filePath)

    console.log("Public URL:", publicUrl)

    // Update comic record with image URL
    const { error: updateError } = await supabase
      .from('comics')
      .update({ 
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', comicId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error("Update error:", updateError)
      // Try to clean up the uploaded file
      await supabase.storage
        .from('comic-images')
        .remove([filePath])
      
      return NextResponse.json({ 
        error: "Failed to update comic with image URL",
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName: fileName,
      filePath: filePath
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
