"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/auth/role-guard"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ShoppingCart, 
  Upload, 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Zap
} from "lucide-react"

interface ShopifyConnection {
  id: string
  store_name: string
  store_url: string
  access_token: string
  is_active: boolean
  last_sync: string | null
  total_products: number
  created_at: string
}

export function ShopifyIntegration() {
  const [connections, setConnections] = useState<ShopifyConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnectForm, setShowConnectForm] = useState(false)
  const [newConnection, setNewConnection] = useState({
    store_name: "",
    store_url: "",
    access_token: ""
  })

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // In a real implementation, you'd fetch from a shopify_connections table
    // For now, we'll simulate with mock data
    setConnections([
      {
        id: "1",
        store_name: "My Comic Store",
        store_url: "my-comic-store.myshopify.com",
        access_token: "***",
        is_active: true,
        last_sync: "2024-01-15T10:30:00Z",
        total_products: 156,
        created_at: "2024-01-01T00:00:00Z"
      }
    ])
    setLoading(false)
  }

  const handleConnect = async () => {
    // In a real implementation, you'd save to database and initiate OAuth flow
    console.log("Connecting to Shopify:", newConnection)
    setShowConnectForm(false)
    setNewConnection({ store_name: "", store_url: "", access_token: "" })
  }

  const handleSync = async (connectionId: string) => {
    // In a real implementation, you'd trigger a sync job
    console.log("Syncing connection:", connectionId)
  }

  const handleDisconnect = async (connectionId: string) => {
    // In a real implementation, you'd remove the connection
    console.log("Disconnecting:", connectionId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shopify Integration</h2>
          <p className="text-gray-600">Connect your Shopify store to sync comics automatically</p>
        </div>
        
        <RoleGuard allowedRoles={['admin', 'lister']}>
          <Button 
            onClick={() => setShowConnectForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Connect Store
          </Button>
        </RoleGuard>
      </div>

      {/* Connection Form */}
      {showConnectForm && (
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-600" />
              Connect New Shopify Store
            </CardTitle>
            <CardDescription>
              Enter your Shopify store details to start syncing comics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="store_name">Store Name</Label>
                <Input
                  id="store_name"
                  placeholder="My Comic Store"
                  value={newConnection.store_name}
                  onChange={(e) => setNewConnection({...newConnection, store_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="store_url">Store URL</Label>
                <Input
                  id="store_url"
                  placeholder="my-comic-store.myshopify.com"
                  value={newConnection.store_url}
                  onChange={(e) => setNewConnection({...newConnection, store_url: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="shpat_..."
                value={newConnection.access_token}
                onChange={(e) => setNewConnection({...newConnection, access_token: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate an access token in your Shopify admin under Apps > App and sales channel settings
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConnect} className="bg-indigo-600 hover:bg-indigo-700">
                Connect Store
              </Button>
              <Button variant="outline" onClick={() => setShowConnectForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      {connections.length > 0 ? (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg">{connection.store_name}</h3>
                      <p className="text-gray-600">{connection.store_url}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={connection.is_active ? "default" : "secondary"}>
                          {connection.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {connection.total_products} products
                        </span>
                        {connection.last_sync && (
                          <span className="text-sm text-gray-500">
                            Last sync: {new Date(connection.last_sync).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RoleGuard allowedRoles={['admin', 'lister']}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(connection.id)}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Sync
                      </Button>
                    </RoleGuard>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${connection.store_url}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Visit Store
                    </Button>
                    
                    <RoleGuard allowedRoles={['admin']}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </RoleGuard>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shopify stores connected</h3>
            <p className="text-gray-600 mb-6">
              Connect your Shopify store to start syncing your comic collection automatically
            </p>
            <RoleGuard allowedRoles={['admin', 'lister']}>
              <Button 
                onClick={() => setShowConnectForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Connect Your First Store
              </Button>
            </RoleGuard>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold text-gray-900">Sync Status</h4>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Last successful sync</div>
              <div className="font-semibold text-gray-900">2 minutes ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
