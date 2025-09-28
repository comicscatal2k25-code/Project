import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
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

    const body = await request.json()
    const { filename, data, headers } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const userId = sessionData.user_id

    let importedCount = 0
    let skippedCount = 0
    let updatedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each row
    for (const [index, row] of data.entries()) {
      try {
        // Map CSV columns to database columns
        const comicData: any = {
          user_id: userId,
          title: row.title || '',
          issue_number: row.issue_number || '',
          series: row.series || '',
          publisher: row.publisher || '',
          era: row.era || '',
          condition: row.condition || '',
          grade: row.grade ? parseFloat(row.grade) : null,
          grading_service: row.grading_service || '',
          current_value: row.current_value ? parseFloat(row.current_value) : null,
          acquired_price: row.acquired_price ? parseFloat(row.acquired_price) : null,
          compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
          inventory_quantity: row.inventory_quantity ? parseInt(row.inventory_quantity) : 1,
          for_sale: row.for_sale === 'true' || row.for_sale === true,
          is_key_issue: row.is_key_issue === 'true' || row.is_key_issue === true,
          key_issue_notes: row.key_issue_notes || '',
          tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [],
          handle: row.handle || '',
          product_type: row.product_type || 'Comic Book',
          vendor: row.vendor || '',
          barcode: row.barcode || '',
          body_html: row.body_html || '',
          updated_at: new Date().toISOString()
        }

        // Check for existing comic (duplicate detection)
        // We'll check by title + issue_number + series combination
        // Also check for empty/null values to avoid false matches
        let duplicateCheck
        if (comicData.title && comicData.issue_number && comicData.series) {
          duplicateCheck = await supabase
            .from('comics')
            .select('id, title, issue_number, series')
            .eq('user_id', userId)
            .eq('title', comicData.title)
            .eq('issue_number', comicData.issue_number)
            .eq('series', comicData.series)
            .limit(1)
        } else if (comicData.title && comicData.issue_number) {
          // If series is empty, check by title + issue_number only
          duplicateCheck = await supabase
            .from('comics')
            .select('id, title, issue_number, series')
            .eq('user_id', userId)
            .eq('title', comicData.title)
            .eq('issue_number', comicData.issue_number)
            .or('series.is.null,series.eq.')
            .limit(1)
        } else {
          // If we don't have enough data to check for duplicates, skip the check
          duplicateCheck = { data: [], error: null }
        }

        if (duplicateCheck.error) {
          console.error(`Error checking for duplicates in row ${index + 1}:`, duplicateCheck.error)
          errors.push(`Row ${index + 1}: Error checking for duplicates - ${duplicateCheck.error.message}`)
          errorCount++
          continue
        }

        if (duplicateCheck.data && duplicateCheck.data.length > 0) {
          // Comic already exists - skip it
          console.log(`Skipping duplicate comic: ${comicData.title} #${comicData.issue_number}`)
          skippedCount++
          continue
        }

        // Add created_at only for new comics
        comicData.created_at = new Date().toISOString()

        // Insert new comic
        const { error: insertError } = await supabase
          .from('comics')
          .insert([comicData])

        if (insertError) {
          console.error(`Error inserting row ${index + 1}:`, insertError)
          errors.push(`Row ${index + 1}: ${insertError.message}`)
          errorCount++
        } else {
          importedCount++
        }

      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error)
        errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
      }
    }

    // Log import session
    const { error: logError } = await supabase
      .from('import_sessions')
      .insert([
        {
          user_id: userId,
          filename: filename,
          total_records: data.length,
          imported_records: importedCount,
          error_records: errorCount,
          status: errorCount === 0 ? 'completed' : 'completed_with_errors',
          errors: errors.length > 0 ? errors.join('; ') : null,
          created_at: new Date().toISOString()
        }
      ])

    if (logError) {
      console.error('Error logging import session:', logError)
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      updatedCount,
      errorCount,
      totalRecords: data.length,
      errors: errors.slice(0, 10) // Return first 10 errors
    })

  } catch (error) {
    console.error("Import error:", error)
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
