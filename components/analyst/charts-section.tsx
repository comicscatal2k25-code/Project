"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, PieChart, TrendingUp, DollarSign } from 'lucide-react'

interface ChartData {
  data: Array<{
    [key: string]: any
  }>
}

export function ChartsSection() {
  const [chartData, setChartData] = useState<Record<string, ChartData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [dateRange, setDateRange] = useState('30')

  const chartTypes = [
    {
      id: 'grade-distribution',
      title: 'Grade Distribution',
      description: 'Distribution of comic grades across the collection',
      icon: PieChart,
      type: 'pie'
    },
    {
      id: 'era-distribution',
      title: 'Items by Era',
      description: 'Top 10 comic eras in the collection',
      icon: BarChart3,
      type: 'bar'
    },
    {
      id: 'price-distribution',
      title: 'Price Distribution',
      description: 'Distribution of comic values by price ranges',
      icon: DollarSign,
      type: 'bar'
    },
    {
      id: 'publish-success',
      title: 'Publish Success Rate',
      description: 'Success vs failure ratio for recent publishes',
      icon: TrendingUp,
      type: 'pie'
    }
  ]

  const fetchChartData = async (chartType: string) => {
    setLoading(prev => ({ ...prev, [chartType]: true }))
    try {
      const response = await fetch(`/api/analytics/charts?type=${chartType}&dateRange=${dateRange}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const data = await response.json()
      setChartData(prev => ({ ...prev, [chartType]: data }))
    } catch (error) {
      console.error(`Error fetching ${chartType} data:`, error)
    } finally {
      setLoading(prev => ({ ...prev, [chartType]: false }))
    }
  }

  useEffect(() => {
    // Fetch all chart data on component mount
    chartTypes.forEach(chart => {
      fetchChartData(chart.id)
    })
  }, [dateRange])

  const renderChart = (chartType: string, data: ChartData) => {
    if (!data.data || data.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      )
    }

    // Simple chart rendering - in production you'd use a proper charting library
    const maxValue = Math.max(...data.data.map(item => 
      typeof item.count === 'number' ? item.count : 0
    ))

    return (
      <div className="space-y-4">
        {data.data.map((item, index) => {
          const value = item.count || 0
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          const label = item.grade || item.era || item.range || item.status || `Item ${index + 1}`
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-gray-600">{value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Charts</h2>
          <p className="text-gray-600">Visual insights into your comic collection data</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Date Range:</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartTypes.map((chart) => {
          const Icon = chart.icon
          const data = chartData[chart.id]
          const isLoading = loading[chart.id]

          return (
            <Card key={chart.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span>{chart.title}</span>
                </CardTitle>
                <p className="text-sm text-gray-600">{chart.description}</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : data ? (
                  renderChart(chart.id, data)
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <Button 
                      variant="outline" 
                      onClick={() => fetchChartData(chart.id)}
                    >
                      Load Chart
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
