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

    const { searchParams } = new URL(request.url)
    const chartType = searchParams.get('type')
    const dateRange = searchParams.get('dateRange') || '30'

    const supabase = await createClient()

    let chartData

    switch (chartType) {
      case 'grade-distribution':
        // Grade distribution
        const { data: gradeData } = await supabase
          .from('comics')
          .select('grade')
          .not('grade', 'is', null)

        const gradeCounts = gradeData?.reduce((acc: Record<string, number>, comic) => {
          const grade = comic.grade?.toString() || 'Unknown'
          acc[grade] = (acc[grade] || 0) + 1
          return acc
        }, {}) || {}

        chartData = Object.entries(gradeCounts).map(([grade, count]) => ({
          grade,
          count
        }))
        break

      case 'era-distribution':
        // Items by era
        const { data: eraData } = await supabase
          .from('comics')
          .select('era')
          .not('era', 'is', null)

        const eraCounts = eraData?.reduce((acc: Record<string, number>, comic) => {
          const era = comic.era || 'Unknown'
          acc[era] = (acc[era] || 0) + 1
          return acc
        }, {}) || {}

        chartData = Object.entries(eraCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([era, count]) => ({
            era,
            count
          }))
        break

      case 'price-distribution':
        // Price distribution (bucketed)
        const { data: priceData } = await supabase
          .from('comics')
          .select('current_value')
          .not('current_value', 'is', null)

        const priceBuckets = {
          '0-50': 0,
          '51-100': 0,
          '101-200': 0,
          '201-500': 0,
          '501-1000': 0,
          '1000+': 0
        }

        priceData?.forEach(comic => {
          const price = comic.current_value || 0
          if (price <= 50) priceBuckets['0-50']++
          else if (price <= 100) priceBuckets['51-100']++
          else if (price <= 200) priceBuckets['101-200']++
          else if (price <= 500) priceBuckets['201-500']++
          else if (price <= 1000) priceBuckets['501-1000']++
          else priceBuckets['1000+']++
        })

        chartData = Object.entries(priceBuckets).map(([range, count]) => ({
          range,
          count
        }))
        break

      case 'publish-success':
        // Publish success vs failure ratio (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
        
        const { data: publishData } = await supabase
          .from('comics')
          .select('for_sale, created_at')
          .gte('created_at', thirtyDaysAgo)

        const successCount = publishData?.filter(comic => comic.for_sale).length || 0
        const failureCount = publishData?.filter(comic => !comic.for_sale).length || 0

        chartData = [
          { status: 'Success', count: successCount },
          { status: 'Failure', count: failureCount }
        ]
        break

      default:
        return NextResponse.json({ error: 'Invalid chart type' }, { status: 400 })
    }

    return NextResponse.json({ data: chartData })

  } catch (error) {
    console.error('Analytics charts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
