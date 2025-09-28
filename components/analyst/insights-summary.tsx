"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  AlertTriangle, 
  Image, 
  Copy, 
  Star, 
  TrendingDown,
  TrendingUp
} from 'lucide-react'

interface SummaryData {
  totalItems: number
  missingRequiredFields: number
  missingImages: number
  itemsWithoutGrade: number
  recentPublishFailures: number
  duplicateCandidates: number
}

export function InsightsSummary() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummaryData()
  }, [])

  const fetchSummaryData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/summary', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch summary data')
      }

      const data = await response.json()
      setSummaryData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading summary data: {error}</p>
            <button 
              onClick={fetchSummaryData}
              className="mt-2 text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summaryData) return null

  const summaryCards = [
    {
      title: 'Total Items',
      value: summaryData.totalItems.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'neutral',
      showBadge: false
    },
    {
      title: 'Missing Required Fields',
      value: summaryData.missingRequiredFields.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'down',
      showBadge: summaryData.missingRequiredFields > 0
    },
    {
      title: 'Missing Images',
      value: summaryData.missingImages.toLocaleString(),
      icon: Image,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'down',
      showBadge: summaryData.missingImages > 0
    },
    {
      title: 'Items Without Grade',
      value: summaryData.itemsWithoutGrade.toLocaleString(),
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'down',
      showBadge: summaryData.itemsWithoutGrade > 0
    },
    {
      title: 'Recent Publish Failures',
      value: summaryData.recentPublishFailures.toLocaleString(),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'down',
      showBadge: summaryData.recentPublishFailures > 0
    },
    {
      title: 'Duplicate Candidates',
      value: summaryData.duplicateCandidates.toLocaleString(),
      icon: Copy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: 'neutral',
      showBadge: summaryData.duplicateCandidates > 0
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Insights</h2>
        <p className="text-gray-600">Key metrics and KPIs for your comic collection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.showBadge && card.trend === 'down' && (
                    <Badge variant="destructive" className="text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Needs Attention
                    </Badge>
                  )}
                  {card.showBadge && card.trend === 'up' && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Good
                    </Badge>
                  )}
                  {card.showBadge && card.trend === 'neutral' && (
                    <Badge variant="secondary" className="text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Review Needed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
