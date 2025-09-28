"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StoreConnections } from '@/components/shopify/store-connections'
import { PublishJobs } from '@/components/shopify/publish-jobs'
import { JobHistory } from '@/components/shopify/job-history'
import { AlertTriangle, Settings, Upload, BarChart3 } from 'lucide-react'

// SHOPIFY: REVIEW - Main Shopify integration page with RBAC
export default function ShopifyPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user role')
      }

      const user = await response.json()
      setUserRole(user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if Shopify feature is enabled
  if (process.env.NEXT_PUBLIC_FEATURE_SHOPIFY !== 'true') {
    return (
      <div className="container mx-auto px-6 py-8">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Shopify integration is not enabled. Contact your administrator to enable this feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Role-based access control
  if (!userRole) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            You must be logged in to access Shopify integration.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const canManageConnections = userRole === 'admin'
  const canViewConnections = ['admin', 'lister'].includes(userRole)
  const canPublish = ['admin', 'lister'].includes(userRole)
  const canViewJobs = ['admin', 'lister', 'analyst', 'viewer'].includes(userRole)

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopify Integration</h1>
          <p className="text-gray-600 mt-2">
            Manage your Shopify store connections and publish comic listings
          </p>
        </div>

        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {canViewConnections && (
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Store Connections
              </TabsTrigger>
            )}
            {canPublish && (
              <TabsTrigger value="publish" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Publish Jobs
              </TabsTrigger>
            )}
            {canViewJobs && (
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Job History
              </TabsTrigger>
            )}
          </TabsList>

          {canViewConnections && (
            <TabsContent value="connections">
              <StoreConnections />
            </TabsContent>
          )}

          {canPublish && (
            <TabsContent value="publish">
              <PublishJobs />
            </TabsContent>
          )}

          {canViewJobs && (
            <TabsContent value="jobs">
              <JobHistory />
            </TabsContent>
          )}
        </Tabs>

        {/* Role-based information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Your Access Level</h3>
          <p className="text-blue-800 text-sm">
            {userRole === 'admin' && 'You have full access to manage store connections, create publish jobs, and view all job history.'}
            {userRole === 'lister' && 'You can create publish jobs and view your own job history, but cannot manage store connections.'}
            {userRole === 'analyst' && 'You can view job history and download reports for analysis, but cannot create publish jobs.'}
            {userRole === 'viewer' && 'You can view basic job status information only.'}
          </p>
        </div>
      </div>
    </div>
  )
}