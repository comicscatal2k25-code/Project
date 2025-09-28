import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import * as XLSX from "xlsx"

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
    const { 
      format = "csv", 
      filterBy = "all", 
      sortBy = "title", 
      includeImages = false, 
      includePrivateNotes = true,
      search = "",
      condition = "all",
      publisher = "all"
    } = body

    // Build query based on filters
    let query = supabase
      .from("comics")
      .select(`
        id,
        title,
        issue_number,
        series,
        publisher,
        era,
        condition,
        grade,
        grading_service,
        current_value,
        acquired_price,
        compare_at_price,
        inventory_quantity,
        for_sale,
        is_key_issue,
        key_issue_notes,
        tags,
        handle,
        product_type,
        vendor,
        barcode,
        body_html,
        image_url,
        created_at,
        updated_at
      `)
      .eq("user_id", sessionData.user_id)

    // Apply filters
    if (filterBy === "for_sale") {
      query = query.eq("for_sale", true)
    } else if (filterBy === "not_for_sale") {
      query = query.eq("for_sale", false)
    }

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`)
    }

    // Apply condition filter
    if (condition && condition !== "all") {
      query = query.eq("condition", condition)
    }

    // Apply publisher filter
    if (publisher && publisher !== "all") {
      query = query.eq("publisher", publisher)
    }

    // Apply sorting
    switch (sortBy) {
      case "title":
        query = query.order("title", { ascending: true })
        break
      case "date_added":
        query = query.order("created_at", { ascending: false })
        break
      case "value":
        query = query.order("current_value", { ascending: false })
        break
      case "publisher":
        query = query.order("publisher", { ascending: true })
        break
      default:
        query = query.order("title", { ascending: true })
    }

    const { data: comics, error } = await query

    if (error) {
      console.error("Error fetching comics:", error)
      return NextResponse.json({ error: "Failed to fetch comics" }, { status: 500 })
    }

    if (!comics || comics.length === 0) {
      return NextResponse.json({ error: "No comics found" }, { status: 404 })
    }

    // Format data based on export format
    let exportData: string | Buffer
    let contentType: string
    let filename: string

    const timestamp = new Date().toISOString().split('T')[0]

    switch (format) {
      case "csv":
        exportData = convertToCSV(comics, includeImages, includePrivateNotes)
        contentType = "text/csv"
        filename = `shopify-comics-import-${timestamp}.csv`
        break
      case "json":
        exportData = JSON.stringify(comics, null, 2)
        contentType = "application/json"
        filename = `comics-export-${timestamp}.json`
        break
      case "xlsx":
        exportData = convertToExcel(comics, includeImages, includePrivateNotes)
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = `shopify-comics-import-${timestamp}.xlsx`
        break
      default:
        exportData = convertToCSV(comics, includeImages, includePrivateNotes)
        contentType = "text/csv"
        filename = `shopify-comics-import-${timestamp}.csv`
    }

    // Handle Excel files differently (they're buffers, not strings)
    if (format === "xlsx") {
      return new NextResponse(exportData as Buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache",
        },
      })
    }

    return new NextResponse(exportData as string, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })

  } catch (error) {
    console.error("Export error:", error)
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function convertToCSV(comics: any[], includeImages: boolean, includePrivateNotes: boolean): string {
  if (comics.length === 0) return ""

  // Define CSV headers matching Shopify product import format
  const headers = [
    "Handle",
    "Title", 
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name", 
    "Option2 Value",
    "Option3 Name",
    "Option3 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Google Shopping / Google Product Category",
    "Google Shopping / Gender",
    "Google Shopping / Age Group",
    "Google Shopping / MPN",
    "Google Shopping / AdWords Grouping",
    "Google Shopping / AdWords Labels",
    "Google Shopping / Condition",
    "Google Shopping / Custom Product",
    "Google Shopping / Custom Label 0",
    "Google Shopping / Custom Label 1",
    "Google Shopping / Custom Label 2",
    "Google Shopping / Custom Label 3",
    "Google Shopping / Custom Label 4",
    "Variant Image",
    "Variant Weight Unit",
    "Variant Tax Code",
    "Cost per item",
    "Price / International",
    "Compare At Price / International",
    "Status"
  ]

  // Add custom comic-specific fields
  const customHeaders = [
    "Comic ID",
    "Series",
    "Publisher", 
    "Era",
    "Condition",
    "Grade",
    "Grading Service",
    "Acquired Price",
    "Is Key Issue",
    "Key Issue Notes",
    "Created At",
    "Updated At"
  ]

  if (includePrivateNotes) {
    customHeaders.push("Private Notes")
  }

  const allHeaders = [...headers, ...customHeaders]

  // Convert comics to CSV rows using Shopify format
  const rows = comics.map(comic => {
    // Generate handle from title (same logic as Shopify transform)
    const handle = comic.handle || comic.title?.toLowerCase()
      ?.replace(/[^a-z0-9\s-]/g, '')
      ?.replace(/\s+/g, '-')
      ?.substring(0, 50) || ""

    // Generate product description
    const description = `${comic.title} - ${comic.series || 'Comic'} (${comic.era || 'Unknown Era'})`
    
    // Generate tags
    const tags = [
      comic.publisher,
      comic.era,
      comic.condition,
      comic.grading_service,
      ...(Array.isArray(comic.tags) ? comic.tags : [])
    ].filter(Boolean).join(", ")

    // Generate variant data
    const variantPrice = (comic.current_value || 0).toString()
    const compareAtPrice = comic.compare_at_price ? comic.compare_at_price.toString() : ""
    const inventoryQty = Math.max(0, comic.inventory_quantity || 0)
    const sku = comic.barcode || `COMIC-${comic.id?.substring(0, 8) || ''}`

    // Generate public image URL for Shopify import
    const imageUrl = comic.image_url || ""

    // Main Shopify product row
    const row = [
      handle,                                    // Handle
      comic.title || "",                         // Title
      description,                               // Body (HTML)
      comic.vendor || comic.publisher || "Unknown", // Vendor
      "Comic Books",                             // Product Category
      comic.product_type || "Comic Book",        // Type
      tags,                                      // Tags
      "TRUE",                                    // Published
      "Title",                                   // Option1 Name
      "Default Title",                           // Option1 Value
      "",                                        // Option2 Name
      "",                                        // Option2 Value
      "",                                        // Option3 Name
      "",                                        // Option3 Value
      sku,                                       // Variant SKU
      "45",                                      // Variant Grams (comic weight)
      "shopify",                                 // Variant Inventory Tracker
      inventoryQty.toString(),                   // Variant Inventory Qty
      "deny",                                    // Variant Inventory Policy
      "manual",                                  // Variant Fulfillment Service
      variantPrice,                              // Variant Price
      compareAtPrice,                            // Variant Compare At Price
      "TRUE",                                    // Variant Requires Shipping
      "TRUE",                                    // Variant Taxable
      comic.barcode || "",                       // Variant Barcode
      imageUrl,                                  // Image Src
      "1",                                       // Image Position
      `${comic.title} - Comic Cover`,            // Image Alt Text
      "FALSE",                                   // Gift Card
      "",                                        // SEO Title
      "",                                        // SEO Description
      "",                                        // Google Shopping / Google Product Category
      "",                                        // Google Shopping / Gender
      "",                                        // Google Shopping / Age Group
      "",                                        // Google Shopping / MPN
      "",                                        // Google Shopping / AdWords Grouping
      "",                                        // Google Shopping / AdWords Labels
      "",                                        // Google Shopping / Condition
      "",                                        // Google Shopping / Custom Product
      "",                                        // Google Shopping / Custom Label 0
      "",                                        // Google Shopping / Custom Label 1
      "",                                        // Google Shopping / Custom Label 2
      "",                                        // Google Shopping / Custom Label 3
      "",                                        // Google Shopping / Custom Label 4
      imageUrl,                                  // Variant Image
      "lb",                                      // Variant Weight Unit
      "",                                        // Variant Tax Code
      comic.acquired_price || "",                // Cost per item
      "",                                        // Price / International
      "",                                        // Compare At Price / International
      "active"                                   // Status
    ]

    // Add custom comic-specific fields
    const customRow = [
      comic.id || "",                            // Comic ID
      comic.series || "",                        // Series
      comic.publisher || "",                     // Publisher
      comic.era || "",                           // Era
      comic.condition || "",                     // Condition
      comic.grade || "",                         // Grade
      comic.grading_service || "",               // Grading Service
      comic.acquired_price || "",                // Acquired Price
      comic.is_key_issue ? "Yes" : "No",         // Is Key Issue
      comic.key_issue_notes || "",               // Key Issue Notes
      comic.created_at || "",                    // Created At
      comic.updated_at || ""                     // Updated At
    ]

    if (includePrivateNotes) {
      customRow.push(comic.internal_notes || "") // Private Notes
    }

    return [...row, ...customRow]
  })

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (typeof value !== 'string') return value
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Combine headers and rows
  const csvContent = [
    allHeaders.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n')

  return csvContent
}

function convertToExcel(comics: any[], includeImages: boolean, includePrivateNotes: boolean): Buffer {
  if (comics.length === 0) {
    // Create empty workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([["No comics found"]])
    XLSX.utils.book_append_sheet(wb, ws, "Comics")
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  }

  // Use the same Shopify format as CSV
  const csvData = convertToCSV(comics, includeImages, includePrivateNotes)
  const lines = csvData.split('\n')
  const rows = lines.map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1')))

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths for Shopify format
  const colWidths = [
    { wch: 20 }, // Handle
    { wch: 30 }, // Title
    { wch: 40 }, // Body (HTML)
    { wch: 15 }, // Vendor
    { wch: 15 }, // Product Category
    { wch: 15 }, // Type
    { wch: 30 }, // Tags
    { wch: 10 }, // Published
    { wch: 12 }, // Option1 Name
    { wch: 15 }, // Option1 Value
    { wch: 12 }, // Option2 Name
    { wch: 15 }, // Option2 Value
    { wch: 12 }, // Option3 Name
    { wch: 15 }, // Option3 Value
    { wch: 20 }, // Variant SKU
    { wch: 12 }, // Variant Grams
    { wch: 20 }, // Variant Inventory Tracker
    { wch: 15 }, // Variant Inventory Qty
    { wch: 20 }, // Variant Inventory Policy
    { wch: 20 }, // Variant Fulfillment Service
    { wch: 12 }, // Variant Price
    { wch: 15 }, // Variant Compare At Price
    { wch: 15 }, // Variant Requires Shipping
    { wch: 12 }, // Variant Taxable
    { wch: 15 }, // Variant Barcode
    { wch: 50 }, // Image Src
    { wch: 12 }, // Image Position
    { wch: 30 }, // Image Alt Text
    { wch: 10 }, // Gift Card
    { wch: 20 }, // SEO Title
    { wch: 30 }, // SEO Description
    { wch: 30 }, // Google Shopping / Google Product Category
    { wch: 15 }, // Google Shopping / Gender
    { wch: 15 }, // Google Shopping / Age Group
    { wch: 15 }, // Google Shopping / MPN
    { wch: 20 }, // Google Shopping / AdWords Grouping
    { wch: 20 }, // Google Shopping / AdWords Labels
    { wch: 15 }, // Google Shopping / Condition
    { wch: 20 }, // Google Shopping / Custom Product
    { wch: 20 }, // Google Shopping / Custom Label 0
    { wch: 20 }, // Google Shopping / Custom Label 1
    { wch: 20 }, // Google Shopping / Custom Label 2
    { wch: 20 }, // Google Shopping / Custom Label 3
    { wch: 20 }, // Google Shopping / Custom Label 4
    { wch: 50 }, // Variant Image
    { wch: 15 }, // Variant Weight Unit
    { wch: 15 }, // Variant Tax Code
    { wch: 12 }, // Cost per item
    { wch: 20 }, // Price / International
    { wch: 25 }, // Compare At Price / International
    { wch: 10 }, // Status
    // Custom comic fields
    { wch: 15 }, // Comic ID
    { wch: 20 }, // Series
    { wch: 15 }, // Publisher
    { wch: 12 }, // Era
    { wch: 12 }, // Condition
    { wch: 8 },  // Grade
    { wch: 15 }, // Grading Service
    { wch: 12 }, // Acquired Price
    { wch: 8 },  // Is Key Issue
    { wch: 20 }, // Key Issue Notes
    { wch: 12 }, // Created At
    { wch: 12 }  // Updated At
  ]

  if (includePrivateNotes) {
    colWidths.push({ wch: 30 }) // Private Notes
  }

  ws['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Shopify Import")

  // Generate Excel file buffer
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
}
