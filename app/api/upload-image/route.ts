import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Image Upload API Called ===")
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
      console.log("No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!comicId) {
      console.log("No comic ID provided")
      return NextResponse.json({ error: "No comic ID provided" }, { status: 400 })
    }

    // If comicId is "new", we need to create a temporary comic first
    let actualComicId = comicId
    if (comicId === "new") {
      console.log("Creating temporary comic for image upload")
      
      // Create a temporary comic record
      const { data: tempComic, error: tempError } = await supabase
        .from('comics')
        .insert({
          user_id: user.id,
          title: 'Temporary Comic for Image Upload',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (tempError) {
        console.error("Error creating temporary comic:", tempError)
        return NextResponse.json({ 
          error: "Failed to create temporary comic for image upload",
          details: tempError.message 
        }, { status: 500 })
      }

      actualComicId = tempComic.id
      console.log("Created temporary comic with ID:", actualComicId)
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
    const fileName = `${actualComicId}-${Date.now()}.${fileExt}`
    const filePath = `comic-covers/${user.id}/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log("Attempting to upload to path:", filePath)
    
    // Upload to Supabase Storage
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

    // Update comic record with image URL
    const { error: updateError } = await supabase
      .from('comics')
      .update({ 
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', actualComicId)
      .eq('user_id', user.id) // Ensure user can only update their own comics

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
      filePath: filePath,
      comicId: actualComicId,
      isTemporary: comicId === "new"
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comicId = searchParams.get('comicId')

    if (!comicId) {
      return NextResponse.json({ error: "No comic ID provided" }, { status: 400 })
    }

    // Get current comic data
    const { data: comic, error: fetchError } = await supabase
      .from('comics')
      .select('image_url')
      .eq('id', comicId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 })
    }

    // Remove image URL from comic record
    const { error: updateError } = await supabase
      .from('comics')
      .update({ 
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', comicId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ 
        error: "Failed to remove image from comic",
        details: updateError.message 
      }, { status: 500 })
    }

    // If there's a stored image, try to delete it from storage
    if (comic.image_url) {
      try {
        // Extract file path from URL
        const url = new URL(comic.image_url)
        const pathParts = url.pathname.split('/')
        const filePath = pathParts.slice(-3).join('/') // Get the last 3 parts (bucket/user/filename)
        
        await supabase.storage
          .from('comic-images')
          .remove([filePath])
      } catch (storageError) {
        console.warn("Failed to delete image from storage:", storageError)
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image removed successfully"
    })

  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
