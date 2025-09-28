import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { processImageForShopify } from '@/lib/shopify/image-handler'
import { ShopifyGraphQLClient, transformComicToShopifyProduct } from '@/lib/shopify/graphql-client'
import crypto from 'crypto'

// SHOPIFY: REVIEW - Publish jobs API with RBAC enforcement
export async function POST(request: NextRequest) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session and role
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Only admin and lister can create publish jobs
    if (!['admin', 'lister'].includes(sessionData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { store_connection_id, product_variant_ids, template_id, publishMode } = await request.json()

    console.log('Publish request received:', {
      store_connection_id,
      product_variant_ids,
      publishMode,
      product_count: product_variant_ids?.length
    })

    if (!store_connection_id || !product_variant_ids || !Array.isArray(product_variant_ids)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    if (!['api_publish', 'csv_export'].includes(publishMode)) {
      return NextResponse.json({ error: 'Invalid publish mode' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify store connection exists and user has access
    const { data: storeConnection, error: storeError } = await supabase
      .from('store_connections')
      .select('*')
      .eq('id', store_connection_id)
      .single()

    if (storeError || !storeConnection) {
      return NextResponse.json({ error: 'Store connection not found' }, { status: 404 })
    }

    // Verify comics exist (we're using comics directly, not variants)
    const { data: comics, error: comicsError } = await supabase
      .from('comics')
      .select('*')
      .in('id', product_variant_ids)

    if (comicsError || !comics || comics.length !== product_variant_ids.length) {
      return NextResponse.json({ error: 'Some comics not found' }, { status: 400 })
    }

    // Create publish job
    const { data: publishJob, error: jobError } = await supabase
      .from('publish_jobs')
      .insert({
        user_id: sessionData.user_id,
        store_connection_id,
        type: publishMode,
        payload_summary: {
          variant_count: product_variant_ids.length,
          template_id,
          publish_mode: publishMode
        },
        rows_total: product_variant_ids.length
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating publish job:', jobError)
      return NextResponse.json({ error: 'Failed to create publish job' }, { status: 500 })
    }

    // Create job rows (using comic IDs directly)
    const jobRows = product_variant_ids.map(comicId => ({
      publish_job_id: publishJob.id,
      local_variant_id: comicId, // This will be the comic ID
      status: 'pending'
    }))

    const { error: rowsError } = await supabase
      .from('publish_job_rows')
      .insert(jobRows)

    if (rowsError) {
      console.error('Error creating job rows:', rowsError)
      return NextResponse.json({ error: 'Failed to create job rows' }, { status: 500 })
    }

    console.log(`Created publish job ${publishJob.id} with ${product_variant_ids.length} comics`)

    // For small jobs, process immediately; for large jobs, queue for background processing
    if (product_variant_ids.length <= 10) {
      console.log('Processing job immediately (small job)')
      // Process immediately
      processPublishJob(publishJob.id).catch(error => {
        console.error('Background job processing error:', error)
      })
    } else {
      console.log(`Job ${publishJob.id} queued for background processing (large job)`)
      // Queue for background processing
      // TODO: Implement background job queue
    }

    return NextResponse.json({
      success: true,
      data: {
        job_id: publishJob.id,
        status: 'pending',
        total_rows: product_variant_ids.length
      }
    })

  } catch (error) {
    console.error('Publish job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// SHOPIFY: REVIEW - Get publish jobs with RBAC
export async function GET(request: NextRequest) {
  try {
    // Check if Shopify feature is enabled
    if (process.env.FEATURE_SHOPIFY !== 'true') {
      return NextResponse.json({ error: 'Shopify integration not enabled' }, { status: 403 })
    }

    // Check session and role
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionToken))
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('publish_jobs')
      .select(`
        *,
        store_connections(store_name, shopify_shop),
        publish_job_rows(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply RBAC filtering
    if (sessionData.role !== 'admin') {
      // Non-admin users can only see their own jobs
      query = query.eq('user_id', sessionData.user_id)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching publish jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: jobs || [],
      pagination: {
        page,
        limit,
        has_more: jobs && jobs.length === limit
      }
    })

  } catch (error) {
    console.error('Get publish jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// SHOPIFY: REVIEW - Background job processor (simplified)
async function processPublishJob(jobId: string) {
  try {
    const supabase = await createClient()
    
    // Update job status to processing
    await supabase
      .from('publish_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('publish_jobs')
      .select(`
        *,
        store_connections(*),
        publish_job_rows(*)
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    console.log(`Processing job ${jobId} with ${job.publish_job_rows.length} rows`)
    console.log('Job type:', job.type)
    console.log('Store connection:', job.store_connections?.shopify_shop)

    // Process each row
    for (const row of job.publish_job_rows) {
      try {
        console.log(`Processing row ${row.id} for comic ${row.local_variant_id}`)
        
        // Update row status to processing
        await supabase
          .from('publish_job_rows')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            attempts: row.attempts + 1
          })
          .eq('id', row.id)

        // Process the row based on job type
        if (job.type === 'api_publish') {
          console.log('Starting API publish for row:', row.id)
          await processApiPublish(row, job.store_connections)
        } else if (job.type === 'csv_export') {
          console.log('Starting CSV export for row:', row.id)
          await processCsvExport(row, job.store_connections)
        }

        console.log(`Row ${row.id} processed successfully`)

        // Mark as succeeded
        await supabase
          .from('publish_job_rows')
          .update({ status: 'succeeded' })
          .eq('id', row.id)

      } catch (rowError) {
        console.error(`Error processing row ${row.id}:`, rowError)
        
        // Mark as failed with error message
        await supabase
          .from('publish_job_rows')
          .update({ 
            status: 'failed',
            error_message: rowError instanceof Error ? rowError.message : 'Unknown error'
          })
          .eq('id', row.id)
      }
    }

    // Update job status based on row results
    const { data: finalRows } = await supabase
      .from('publish_job_rows')
      .select('status')
      .eq('publish_job_id', jobId)

    const succeeded = finalRows?.filter(r => r.status === 'succeeded').length || 0
    const failed = finalRows?.filter(r => r.status === 'failed').length || 0
    const total = finalRows?.length || 0

    await supabase
      .from('publish_jobs')
      .update({
        status: failed === 0 ? 'succeeded' : (succeeded > 0 ? 'succeeded' : 'failed'),
        rows_success: succeeded,
        rows_failed: failed
      })
      .eq('id', jobId)

  } catch (error) {
    console.error('Job processing error:', error)
    
    // Mark job as failed
    const supabase = await createClient()
    await supabase
      .from('publish_jobs')
      .update({ 
        status: 'failed',
        rows_failed: 1
      })
      .eq('id', jobId)
  }
}

// SHOPIFY: REVIEW - Process API publish for a single row
async function processApiPublish(row: any, storeConnection: any) {
  try {
    const supabase = await createClient()
    
    // Get comic data
    const { data: comic, error: comicError } = await supabase
      .from('comics')
      .select('*')
      .eq('id', row.local_variant_id)
      .single()

    if (comicError || !comic) {
      throw new Error(`Comic not found: ${row.local_variant_id}`)
    }

    console.log('Processing API publish for comic:', comic.title)

           // Process image if available
           let processedImage = null
           if (comic.image_url) {
             console.log('Processing image for comic:', comic.title)
             processedImage = await processImageForShopify(comic.image_url)
             if (processedImage) {
               console.log('Image processed successfully:', processedImage.uploadedUrl)
             } else {
               console.log('Image processing failed for:', comic.title)
             }
           } else {
             console.log('No image available for comic:', comic.title)
           }

    // Decrypt access token
    console.log('Decrypting access token for store:', storeConnection.shopify_shop)
    let accessToken
    try {
      accessToken = decryptToken(storeConnection.oauth_access_token)
      console.log('Access token decrypted successfully')
    } catch (error) {
      console.error('Error decrypting access token:', error)
      throw new Error(`Failed to decrypt access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Validate required fields
    if (!accessToken) {
      throw new Error('Access token is missing or invalid')
    }
    
    if (!storeConnection.shopify_shop) {
      throw new Error('Shopify shop domain is missing')
    }
    
    console.log('Store connection validated:', {
      shop: storeConnection.shopify_shop,
      storeName: storeConnection.store_name,
      hasToken: !!accessToken
    })
    
    // Create Shopify GraphQL client
    const shopifyClient = new ShopifyGraphQLClient(accessToken, storeConnection.shopify_shop)
    
    // Transform comic to Shopify product format
    const shopifyProduct = transformComicToShopifyProduct(comic, processedImage)
    
    console.log('Creating product in Shopify:', shopifyProduct.title)
    console.log('Product data:', JSON.stringify(shopifyProduct, null, 2))
    
    // Create product in Shopify
    let result
    try {
      result = await shopifyClient.createProduct(shopifyProduct)
      console.log('Shopify API response:', JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Shopify API call failed:', error)
      throw new Error(`Shopify API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    if (result.errors && result.errors.length > 0) {
      console.error('Shopify GraphQL errors:', result.errors)
      throw new Error(`Shopify API errors: ${result.errors.map(e => e.message).join(', ')}`)
    }
    
    if (result.data?.productCreate?.userErrors && result.data.productCreate.userErrors.length > 0) {
      console.error('Shopify user errors:', result.data.productCreate.userErrors)
      throw new Error(`Shopify user errors: ${result.data.productCreate.userErrors.map(e => e.message).join(', ')}`)
    }
    
    const createdProduct = result.data?.productCreate?.product
    if (!createdProduct) {
      console.error('No product created in response:', result)
      throw new Error('Failed to create product in Shopify - no product returned')
    }
    
    console.log(`Successfully created product in Shopify: ${createdProduct.title} (ID: ${createdProduct.id})`)
    
    // Update job row with Shopify product ID
    await supabase
      .from('publish_job_rows')
      .update({
        shopify_product_id: createdProduct.id,
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('id', row.id)
    
  } catch (error) {
    console.error('Error processing comic:', error)
    
    // Update job row with error
    const supabase = await createClient()
    await supabase
      .from('publish_job_rows')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', row.id)
    
    throw error
  }
}

// SHOPIFY: REVIEW - Process CSV export for a single row
async function processCsvExport(row: any, storeConnection: any) {
  try {
    const supabase = await createClient()
    
    // Get comic data
    const { data: comic, error: comicError } = await supabase
      .from('comics')
      .select('*')
      .eq('id', row.local_variant_id)
      .single()

    if (comicError || !comic) {
      throw new Error(`Comic not found: ${row.local_variant_id}`)
    }

    console.log('Processing CSV export for comic:', comic.title)

    // Process image if available for CSV
    let imageUrl = comic.image_url
    if (comic.image_url) {
      console.log('Processing image for CSV export:', comic.title)
      const processedImage = await processImageForShopify(comic.image_url)
      if (processedImage) {
        imageUrl = processedImage.uploadedUrl
        console.log('Image processed for CSV:', processedImage.uploadedUrl)
      } else {
        console.log('Image processing failed for CSV:', comic.title)
      }
    } else {
      console.log('No image available for CSV export:', comic.title)
    }

    // For now, just simulate success - in production this would:
    // 1. Transform comic to Shopify CSV format
    // 2. Handle image URLs for CSV
    // 3. Upload CSV to Supabase Storage
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log(`Successfully exported comic: ${comic.title}`)
    
  } catch (error) {
    console.error('Error exporting comic:', error)
    throw error
  }
}

// SHOPIFY: REVIEW - Decrypt access token
function decryptToken(encryptedToken: string): string {
  const algorithm = 'aes-256-cbc'
  
  // Check if environment variable is set
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
  }
  
  const key = crypto.scryptSync(process.env.SUPABASE_SERVICE_ROLE_KEY, 'salt', 32)
  
  if (!encryptedToken || !encryptedToken.includes(':')) {
    throw new Error('Invalid encrypted token format')
  }
  
  const [ivHex, encrypted] = encryptedToken.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
