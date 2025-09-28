"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportHistory {
  id: string
  report_name: string
  report_type: string
  user_id: string
  created_at: string
  details: {
    row_count: number
    format: string
    filename: string
  }
  status: 'completed' | 'failed' | 'processing'
}

export function RecentReports() {
  const [reports, setReports] = useState<ReportHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentReports()
  }, [])

  const fetchRecentReports = async () => {
    try {
      setLoading(true)
      // For now, we'll simulate recent reports since we don't have a dedicated endpoint
      // In production, you'd fetch from /api/analytics/reports/history
      const mockReports: ReportHistory[] = [
        {
          id: '1',
          report_name: 'Missing Required Fields Report',
          report_type: 'missing-required-fields',
          user_id: 'current-user',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          details: {
            row_count: 15,
            format: 'csv',
            filename: 'missing_fields_2024-01-15.csv'
          },
          status: 'completed'
        },
        {
          id: '2',
          report_name: 'High Value Items Report',
          report_type: 'high-value-items',
          user_id: 'current-user',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          details: {
            row_count: 42,
            format: 'xlsx',
            filename: 'high_value_2024-01-14.xlsx'
          },
          status: 'completed'
        },
        {
          id: '3',
          report_name: 'Potential Duplicates Report',
          report_type: 'potential-duplicates',
          user_id: 'current-user',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          details: {
            row_count: 8,
            format: 'csv',
            filename: 'duplicates_2024-01-12.csv'
          },
          status: 'completed'
        }
      ]
      
      setReports(mockReports)
    } catch (error) {
      console.error('Error fetching recent reports:', error)
      toast.error('Failed to load recent reports')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleDownload = (report: ReportHistory) => {
    // In production, this would generate a signed URL for download
    toast.info('Download functionality would be implemented with signed URLs')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Reports</h2>
          <p className="text-gray-600">View and download previously generated reports</p>
        </div>
        <Button onClick={fetchRecentReports} variant="outline">
          <BarChart3 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-4">Generate your first report using the Reports Builder</p>
            <Button onClick={() => window.location.hash = 'reports'}>
              Go to Reports Builder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {report.report_name}
                      </h3>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>{report.details.row_count.toLocaleString()} rows</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{report.details.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{report.details.filename}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(report.status)}
                    {report.status === 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(report)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
