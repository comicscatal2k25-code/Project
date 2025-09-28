import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(request: NextRequest) {
  try {
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

    // Check if user has analyst role or higher
    if (!['admin', 'analyst'].includes(sessionData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { template, filters, columns, format = 'csv', reportName } = body

    const supabase = await createClient()

    let query = supabase.from('comics').select('*')
    let reportData: any[] = []
    let reportTitle = reportName || 'Comic Report'

    // Apply template-based queries
    switch (template) {
      case 'missing-required-fields':
        query = query.or('title.is.null,current_value.is.null,image_url.is.null')
        reportTitle = 'Missing Required Fields Report'
        break

      case 'missing-images':
        query = query.is('image_url', null)
        reportTitle = 'Missing Images Report'
        break

      case 'potential-duplicates':
        // This is a simplified version - in production you'd want more sophisticated fuzzy matching
        const { data: allComics } = await supabase
          .from('comics')
          .select('id, title, series, issue_number')
          .not('title', 'is', null)

        const duplicates: any[] = []
        const seen = new Set()

        allComics?.forEach(comic => {
          const key = `${comic.title?.toLowerCase()}-${comic.series?.toLowerCase()}-${comic.issue_number}`
          if (seen.has(key)) {
            duplicates.push(comic)
          } else {
            seen.add(key)
          }
        })

        reportData = duplicates
        reportTitle = 'Potential Duplicates Report'
        break

      case 'recent-publish-failures':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query
          .gte('created_at', sevenDaysAgo)
          .eq('for_sale', false)
        reportTitle = 'Recent Publish Failures Report'
        break

      case 'key-issues':
        query = query.eq('is_key_issue', true)
        reportTitle = 'Key Issues Report'
        break

      case 'high-value-items':
        const minPrice = filters?.minPrice || 100
        query = query
          .not('current_value', 'is', null)
          .gte('current_value', minPrice)
          .order('current_value', { ascending: false })
        reportTitle = `High Value Items ($${minPrice}+) Report`
        break

      default:
        return NextResponse.json({ error: 'Invalid report template' }, { status: 400 })
    }

    // Execute query if not already populated (for duplicates)
    if (reportData.length === 0) {
      const { data, error } = await query
      if (error) {
        console.error('Query error:', error)
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
      }
      reportData = data || []
    }

    // Check row limit
    if (reportData.length > 200000) {
      return NextResponse.json({ 
        error: 'Export too large. Please narrow your filters. Maximum 200,000 rows allowed.' 
      }, { status: 400 })
    }

    // Generate file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${format}`
    
    let fileContent: string
    let mimeType: string

    if (format === 'csv') {
      // Generate CSV
      if (reportData.length === 0) {
        fileContent = 'No data found'
      } else {
        const headers = Object.keys(reportData[0]).join(',')
        const rows = reportData.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        )
        fileContent = [headers, ...rows].join('\n')
      }
      mimeType = 'text/csv'
    } else {
      // For XLSX, we'll use a simple CSV format for now
      // In production, you'd want to use a library like 'xlsx'
      if (reportData.length === 0) {
        fileContent = 'No data found'
      } else {
        const headers = Object.keys(reportData[0]).join('\t')
        const rows = reportData.map(row => 
          Object.values(row).join('\t')
        )
        fileContent = [headers, ...rows].join('\n')
      }
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filename, fileContent, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(filename)

    // Log the report generation
    await supabase.from('audit_logs').insert({
      profile_id: sessionData.user_id,
      action: 'report_generated',
      details: {
        report_type: template,
        report_name: reportTitle,
        row_count: reportData.length,
        format,
        filename
      },
      created_at: new Date().toISOString()
    }).catch(err => {
      console.error('Audit log error:', err)
      // Don't fail the request if audit logging fails
    })

    return NextResponse.json({
      success: true,
      reportId: uploadData.path,
      downloadUrl: urlData.publicUrl,
      filename,
      rowCount: reportData.length,
      reportName: reportTitle
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
