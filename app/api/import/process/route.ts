import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { session_id, file_content } = await request.json()

    // Parse CSV content
    const lines = file_content.split("\n").filter((line: string) => line.trim())
    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
    const dataRows = lines.slice(1)

    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const values = dataRows[i].split(",").map((v: string) => v.trim())
        const rowData: any = {}

        // Map CSV columns to database fields
        headers.forEach((header, index) => {
          const value = values[index]
          if (value && value !== "") {
            switch (header) {
              case "title":
                rowData.title = value
                break
              case "issue_number":
                rowData.issue_number = value
                break
              case "condition":
                rowData.condition = value
                break
              case "grade":
                rowData.grade = value
                break
              case "publication_date":
                rowData.publication_date = value
                break
              case "cover_price":
                rowData.cover_price = Number.parseFloat(value)
                break
              case "acquired_price":
                rowData.acquired_price = Number.parseFloat(value)
                break
              case "current_value":
                rowData.current_value = Number.parseFloat(value)
                break
              case "for_sale":
                rowData.for_sale = value.toLowerCase() === "true"
                break
              case "sale_price":
                rowData.sale_price = Number.parseFloat(value)
                break
              case "location":
                rowData.location = value
                break
              case "notes":
                rowData.notes = value
                break
            }
          }
        })

        // Add required fields
        rowData.user_id = user.id

        // Insert comic
        const { error } = await supabase.from("comics").insert([rowData])

        if (error) {
          errorCount++
          errors.push({ row: i + 2, error: error.message, data: rowData })
        } else {
          successCount++
        }
      } catch (error) {
        errorCount++
        errors.push({ row: i + 2, error: "Invalid row format", data: dataRows[i] })
      }
    }

    // Update import session
    await supabase
      .from("import_sessions")
      .update({
        processed_records: successCount + errorCount,
        successful_records: successCount,
        failed_records: errorCount,
        status: errorCount === 0 ? "completed" : "completed",
        error_log: errors.length > 0 ? errors : null,
      })
      .eq("id", session_id)

    return NextResponse.json({
      success: true,
      processed: successCount + errorCount,
      successful: successCount,
      failed: errorCount,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error) {
    console.error("Import processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
