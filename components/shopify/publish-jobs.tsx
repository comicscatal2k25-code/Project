"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Download, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

// SHOPIFY: REVIEW - Publish jobs management UI with RBAC
export function PublishJobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [comics, setComics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [selectedMode, setSelectedMode] = useState<'api_publish' | 'csv_export'>('api_publish')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetchJobs()
    fetchStores()
    fetchComics()
    fetchUserRole()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shopify/publish', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data = await response.json()
      setJobs(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/shopify/connections', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stores')
      }

      const data = await response.json()
      setStores(data.data || [])
    } catch (err) {
      console.error('Error fetching stores:', err)
      setStores([])
    }
  }

  const fetchComics = async () => {
    try {
      const response = await fetch('/api/comics', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch comics')
      }

      const data = await response.json()
      // The API returns comics directly as an array, not wrapped in data property
      setComics(data || [])
    } catch (err) {
      console.error('Error fetching comics:', err)
      setComics([])
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

  const handleComicToggle = (comicId: string) => {
    setSelectedVariants(prev => 
      prev.includes(comicId) 
        ? prev.filter(id => id !== comicId)
        : [...prev, comicId]
    )
  }

  const handlePublish = async () => {
    if (!selectedStore || selectedStore === 'no-stores' || selectedVariants.length === 0) {
      setError('Please select a store and at least one comic to publish')
      return
    }

    try {
      setPublishing(true)
      setError(null)

      const response = await fetch('/api/shopify/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          store_connection_id: selectedStore,
          product_variant_ids: selectedVariants,
          publishMode: selectedMode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create publish job')
      }

      const data = await response.json()
      
      // Refresh jobs list and stores
      await fetchJobs()
      await fetchStores()
      
      // Clear selection
      setSelectedVariants([])
      setSelectedStore('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPublishing(false)
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

  const canPublish = userRole && ['admin', 'lister'].includes(userRole)
  const canViewDetails = userRole && ['admin', 'lister', 'analyst'].includes(userRole)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publish Jobs</CardTitle>
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
      {/* Publish Controls - Only for Admin and Lister */}
      {canPublish && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Publish Comics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Store</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder={stores.length === 0 ? "No stores connected" : "Select store"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.length === 0 ? (
                      <SelectItem value="no-stores" disabled>No stores connected</SelectItem>
                    ) : (
                      stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.store_name} ({store.shopify_shop})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Publish Mode</label>
                <Select value={selectedMode} onValueChange={(value: 'api_publish' | 'csv_export') => setSelectedMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_publish">API Publish</SelectItem>
                    <SelectItem value="csv_export">CSV Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handlePublish}
                  disabled={publishing || !selectedStore || selectedStore === 'no-stores' || selectedVariants.length === 0}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {publishing ? 'Publishing...' : selectedVariants.length === 0 ? 'Select Comics First' : 'Start Publish'}
                </Button>
              </div>
            </div>

            {/* Comic Selection */}
            <div>
              <label className="text-sm font-medium">Select Comics to Publish</label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                {comics.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No comics available</p>
                ) : (
                  comics.map((comic) => (
                    <div key={comic.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`comic-${comic.id}`}
                        checked={selectedVariants.includes(comic.id)}
                        onCheckedChange={() => handleComicToggle(comic.id)}
                      />
                      <label htmlFor={`comic-${comic.id}`} className="text-sm flex-1">
                        <span className="font-medium">{comic.title}</span>
                        <span className="text-gray-500 ml-2">({comic.publisher} • {comic.series})</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedVariants.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedVariants.length} comic{selectedVariants.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Publish Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No publish jobs yet. {canPublish ? 'Create your first publish job above.' : 'No jobs available.'}
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
                        View Details
                      </Button>
                    )}
                    {canPublish && job.status === 'failed' && (
                      <Button variant="outline" size="sm">
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
