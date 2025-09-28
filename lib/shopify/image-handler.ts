import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// SHOPIFY: REVIEW - Image handling utilities for Shopify integration

export interface ImageValidationResult {
  isValid: boolean
  error?: string
  width?: number
  height?: number
  size?: number
  checksum?: string
}

export interface ProcessedImage {
  originalUrl: string
  uploadedUrl: string
  checksum: string
  width: number
  height: number
  size: number
}

// SHOPIFY: REVIEW - Simplified image processing - just return the original URL
export async function processImageForShopify(imageUrl: string): Promise<ProcessedImage | null> {
  try {
    console.log('Processing image URL:', imageUrl)
    
    // Basic URL validation
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log('Invalid image URL:', imageUrl)
      return null
    }

    // For now, just return the original URL without processing
    // This avoids all the RLS and storage issues
    const processedImage: ProcessedImage = {
      originalUrl: imageUrl,
      uploadedUrl: imageUrl, // Use original URL directly
      checksum: crypto.createHash('sha256').update(imageUrl).digest('hex'),
      width: 800, // Placeholder
      height: 600, // Placeholder
      size: 0 // Placeholder
    }

    console.log('Image processed successfully (using original URL):', imageUrl)
    return processedImage

  } catch (error) {
    console.error('Image processing error:', error)
    return null
  }
}

// SHOPIFY: REVIEW - Validate image URL and properties
async function validateImage(imageUrl: string): Promise<ImageValidationResult> {
  try {
    // Basic URL validation
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return { isValid: false, error: 'Invalid image URL' }
    }

    // Download image to validate
    const response = await fetch(imageUrl, { method: 'HEAD' })
    if (!response.ok) {
      return { isValid: false, error: 'Image not accessible' }
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return { isValid: false, error: 'Not a valid image file' }
    }

    const contentLength = response.headers.get('content-length')
    const size = contentLength ? parseInt(contentLength) : 0

    // Check size limits (5MB max)
    if (size > 5 * 1024 * 1024) {
      return { isValid: false, error: 'Image too large (max 5MB)' }
    }

    // Download full image for detailed validation
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return { isValid: false, error: 'Failed to download image' }
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex')

    // Get image dimensions (simplified - in production, use sharp or similar)
    // For now, we'll assume valid dimensions if we got this far
    const width = 800 // Placeholder - would use image library
    const height = 600 // Placeholder - would use image library

    return {
      isValid: true,
      width,
      height,
      size,
      checksum
    }

  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    }
  }
}

// SHOPIFY: REVIEW - Download and upload image to Supabase Storage
async function downloadAndUploadImage(
  imageUrl: string, 
  validation: ImageValidationResult
): Promise<ProcessedImage> {
  const supabase = await createClient()
  
  // Download image
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error('Failed to download image')
  }

  const imageBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(imageBuffer)

  // Generate filename
  const extension = imageUrl.split('.').pop() || 'jpg'
  const filename = `${validation.checksum}.${extension}`

  // Upload to Supabase Storage
         // Try to upload to shopify_images bucket first, fallback to comic-images if it fails
         let uploadResult
         try {
           uploadResult = await supabase.storage
             .from('shopify_images')
             .upload(filename, buffer, {
               contentType: response.headers.get('content-type') || 'image/jpeg',
               upsert: true
             })
         } catch (error) {
           console.log('Failed to upload to shopify_images bucket, trying comic-images:', error)
           // Fallback to comic-images bucket
           uploadResult = await supabase.storage
             .from('comic-images')
             .upload(`shopify/${filename}`, buffer, {
               contentType: response.headers.get('content-type') || 'image/jpeg',
               upsert: true
             })
         }

         const { data, error } = uploadResult

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  // Generate public URL based on which bucket was used
  let urlData
  if (data.path.includes('shopify/')) {
    // Used comic-images bucket
    urlData = supabase.storage
      .from('comic-images')
      .getPublicUrl(data.path)
  } else {
    // Used shopify_images bucket
    urlData = supabase.storage
      .from('shopify_images')
      .getPublicUrl(filename)
  }

  return {
    originalUrl: imageUrl,
    uploadedUrl: urlData.publicUrl,
    checksum: validation.checksum!,
    width: validation.width!,
    height: validation.height!,
    size: validation.size!
  }
}

// SHOPIFY: REVIEW - Find existing image by checksum
async function findImageByChecksum(checksum: string): Promise<ProcessedImage | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('image_assets')
    .select('*')
    .eq('checksum', checksum)
    .single()

  if (error || !data) {
    return null
  }

  return {
    originalUrl: data.original_url,
    uploadedUrl: data.uploaded_url,
    checksum: data.checksum,
    width: data.width,
    height: data.height,
    size: data.size
  }
}

// SHOPIFY: REVIEW - Store image metadata
async function storeImageMetadata(image: ProcessedImage): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('image_assets')
    .insert({
      original_url: image.originalUrl,
      uploaded_url: image.uploadedUrl,
      checksum: image.checksum,
      width: image.width,
      height: image.height,
      size: image.size,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error storing image metadata:', error)
    // Don't throw - this is not critical for the main flow
  }
}

// SHOPIFY: REVIEW - Batch process multiple images
export async function processImagesForShopify(imageUrls: string[]): Promise<{
  processed: ProcessedImage[]
  failed: { url: string; error: string }[]
}> {
  const processed: ProcessedImage[] = []
  const failed: { url: string; error: string }[] = []

  for (const url of imageUrls) {
    try {
      const result = await processImageForShopify(url)
      if (result) {
        processed.push(result)
      } else {
        failed.push({ url, error: 'Processing failed' })
      }
    } catch (error) {
      failed.push({ 
        url, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  return { processed, failed }
}
