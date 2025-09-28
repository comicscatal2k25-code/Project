"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  RotateCcw
} from 'lucide-react'

// SHOPIFY: REVIEW - Job history view (read-only)
export function JobHistory() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
    fetchUserRole()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shopify/publish', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch job history')
      }

      const data = await response.json()
      setJobs(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      if (response.ok) {
        const user = await response.json()
        setUserRole(user.role)
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      succeeded: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const canViewDetails = userRole && ['admin', 'lister', 'analyst'].includes(userRole)
  const canRetry = userRole && ['admin', 'lister'].includes(userRole)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Job History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No job history available.
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h3 className="font-medium">
                        {job.type === 'api_publish' ? 'API Publish' : 'CSV Export'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {job.store_connections?.store_name} • {job.rows_total} items
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(job.created_at)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(job.status)}
                        <span className="text-xs text-gray-500">
                          {job.rows_success} succeeded, {job.rows_failed} failed
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canViewDetails && (
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    )}
                    {canRetry && job.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Retry Failed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
