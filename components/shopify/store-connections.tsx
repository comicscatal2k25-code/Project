"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Store, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react'

// SHOPIFY: REVIEW - Store connections management UI with RBAC
export function StoreConnections() {
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [shopInput, setShopInput] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetchConnections()
    fetchUserRole()
  }, [])

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

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shopify/connections', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch connections')
      }

      const data = await response.json()
      setConnections(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!shopInput.trim()) {
      setError('Please enter a shop name')
      return
    }

    try {
      setConnecting(true)
      setError(null)

      const response = await fetch('/api/shopify/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ shop: shopInput })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate connection')
      }

      const data = await response.json()
      
      // Redirect to OAuth URL
      window.location.href = data.data.oauthUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/shopify/connections/${connectionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect store')
      }

      await fetchConnections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Connections</CardTitle>
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
            <Store className="w-5 h-5" />
            Store Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Connect new store - Admin only */}
          {userRole === 'admin' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="shop">Shop Name</Label>
                <Input
                  id="shop"
                  placeholder="your-store.myshopify.com"
                  value={shopInput}
                  onChange={(e) => setShopInput(e.target.value)}
                  disabled={connecting}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleConnect} 
                  disabled={connecting || !shopInput.trim()}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {connecting ? 'Connecting...' : 'Connect Store'}
                </Button>
              </div>
            </div>
          )}

          {/* Connected stores */}
          <div className="space-y-3">
            {connections.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No stores connected yet. Connect your first Shopify store above.
              </p>
            ) : (
              connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium">{connection.store_name}</h3>
                      <p className="text-sm text-gray-500">{connection.shopify_shop}</p>
                      <div className="flex gap-2 mt-1">
                        {connection.scopes.map((scope: string) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${connection.shopify_shop}/admin`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {userRole === 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(connection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
