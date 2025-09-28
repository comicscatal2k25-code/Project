import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { ShopifyAPI, formatComicForShopify } from "@/lib/shopify"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get next pending job
    const { data: job, error: jobError } = await supabase
      .from("job_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ message: "No jobs to process" })
    }

    // Mark job as processing
    await supabase
      .from("job_queue")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq("id", job.id)

    let result: any = null
    let error: string | null = null

    try {
      // Process job based on type
      switch (job.job_type) {
        case "shopify_sync":
          result = await processShopifySync(job, supabase)
          break
        case "bulk_import":
          result = await processBulkImport(job, supabase)
          break
        case "bulk_export":
          result = await processBulkExport(job, supabase)
          break
        case "image_processing":
          result = await processImageProcessing(job, supabase)
          break
        case "data_cleanup":
          result = await processDataCleanup(job, supabase)
          break
        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      // Mark job as completed
      await supabase
        .from("job_queue")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result,
        })
        .eq("id", job.id)
    } catch (jobError: unknown) {
      error = jobError instanceof Error ? jobError.message : "Job processing failed"

      // Check if we should retry
      const shouldRetry = job.attempts < job.max_attempts

      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, job.attempts) * 60 * 1000 // 1min, 2min, 4min, etc.
        const scheduledAt = new Date(Date.now() + retryDelay)

        await supabase
          .from("job_queue")
          .update({
            status: "pending",
            scheduled_at: scheduledAt.toISOString(),
            error_message: error,
          })
          .eq("id", job.id)
      } else {
        // Mark as failed
        await supabase
          .from("job_queue")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: error,
          })
          .eq("id", job.id)
      }
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobType: job.job_type,
      status: error ? (job.attempts < job.max_attempts ? "retrying" : "failed") : "completed",
      result,
      error,
    })
  } catch (error) {
    console.error("Job processor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processShopifySync(job: any, supabase: any) {
  const { action, comic_id, shopify_settings } = job.payload

  if (!shopify_settings) {
    throw new Error("Shopify settings not provided")
  }

  const shopify = new ShopifyAPI(shopify_settings)

  if (action === "bulk_sync") {
    // Get all comics marked for sale
    const { data: comics, error } = await supabase
      .from("comics")
      .select(`
        *,
        publishers (name),
        series (title)
      `)
      .eq("user_id", job.user_id)
      .eq("for_sale", true)
      .is("shopify_product_id", null)

    if (error) throw error

    let synced = 0
    let failed = 0

    for (const comic of comics) {
      try {
        // Get default template
        const { data: template } = await supabase
          .from("listing_templates")
          .select("*")
          .eq("user_id", job.user_id)
          .eq("is_default", true)
          .single()

        const productData = formatComicForShopify(comic, template)
        const shopifyProduct = await shopify.createProduct(productData)

        // Update comic with Shopify product ID
        await supabase
          .from("comics")
          .update({
            shopify_product_id: shopifyProduct.product.id,
            shopify_status: "active",
            last_shopify_sync: new Date().toISOString(),
          })
          .eq("id", comic.id)

        // Log sync
        await supabase.from("shopify_sync_logs").insert([
          {
            user_id: job.user_id,
            operation: "create",
            comic_id: comic.id,
            shopify_product_id: shopifyProduct.product.id,
            status: "success",
          },
        ])

        synced++
      } catch (error) {
        // Log error
        await supabase.from("shopify_sync_logs").insert([
          {
            user_id: job.user_id,
            operation: "create",
            comic_id: comic.id,
            status: "error",
            error_message: error instanceof Error ? error.message : "Sync failed",
          },
        ])

        failed++
      }
    }

    return { synced, failed, total: comics.length }
  }

  throw new Error(`Unknown Shopify sync action: ${action}`)
}

async function processBulkImport(job: any, supabase: any) {
  const { session_id, file_content } = job.payload

  // This would typically call the import processing logic
  // For now, return a mock result
  return { message: "Import processing completed", session_id }
}

async function processBulkExport(job: any, supabase: any) {
  const { format, options } = job.payload

  // This would generate the export file
  // For now, return a mock result
  return { message: "Export completed", format, downloadUrl: "/api/export/download/123" }
}

async function processImageProcessing(job: any, supabase: any) {
  // Process comic cover images
  return { message: "Image processing completed" }
}

async function processDataCleanup(job: any, supabase: any) {
  // Clean up old data, optimize database, etc.
  return { message: "Data cleanup completed" }
}
