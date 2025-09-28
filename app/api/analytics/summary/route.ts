import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    const supabase = await createClient()

    // Get summary KPIs
    const [
      totalComicsResult,
      missingFieldsResult,
      missingImagesResult,
      itemsWithoutGradeResult,
      recentFailuresResult,
      duplicateCandidatesResult
    ] = await Promise.all([
      // Total items in catalog
      supabase
        .from('comics')
        .select('*', { count: 'exact', head: true }),

      // Items missing required fields (title, current_value, or image_url)
      supabase
        .from('comics')
        .select('*', { count: 'exact', head: true })
        .or('title.is.null,current_value.is.null,image_url.is.null'),

      // Items missing images (image_url is null or empty)
      supabase
        .from('comics')
        .select('*', { count: 'exact', head: true })
        .or('image_url.is.null,image_url.eq.'),

      // Items without grade
      supabase
        .from('comics')
        .select('*', { count: 'exact', head: true })
        .is('grade', null),

      // Recent publish failures (last 7 days) - using created_at as proxy
      supabase
        .from('comics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('for_sale', false),

      // Potential duplicates (same title and series)
      supabase
        .from('comics')
        .select('title, series', { count: 'exact', head: true })
        .not('title', 'is', null)
        .not('series', 'is', null)
    ])

    // Calculate actual duplicates by checking for comics with same title and series
    const duplicateCheckResult = await supabase
      .from('comics')
      .select('title, series')
      .not('title', 'is', null)
      .not('series', 'is', null)

    let duplicateCount = 0
    if (duplicateCheckResult.data) {
      const titleSeriesMap = new Map()
      duplicateCheckResult.data.forEach(comic => {
        const key = `${comic.title}-${comic.series}`
        if (titleSeriesMap.has(key)) {
          titleSeriesMap.set(key, titleSeriesMap.get(key) + 1)
        } else {
          titleSeriesMap.set(key, 1)
        }
      })
      
      // Count groups with more than 1 comic
      duplicateCount = Array.from(titleSeriesMap.values()).filter(count => count > 1).length
    }

    const summary = {
      totalItems: totalComicsResult.count || 0,
      missingRequiredFields: missingFieldsResult.count || 0,
      missingImages: missingImagesResult.count || 0,
      itemsWithoutGrade: itemsWithoutGradeResult.count || 0,
      recentPublishFailures: recentFailuresResult.count || 0,
      duplicateCandidates: duplicateCount
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
