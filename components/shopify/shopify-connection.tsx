"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Store } from "lucide-react"

interface ShopifyConnectionProps {
  userId: string
  existingSettings: any
}

export function ShopifyConnection({ userId, existingSettings }: ShopifyConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    shop_domain: existingSettings?.shop_domain || "",
    access_token: existingSettings?.access_token || "",
  })

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    setError(null)

    const supabase = createClient()

    try {
      // Validate shop domain format
      const shopDomain = formData.shop_domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
      if (!shopDomain.includes(".myshopify.com") && !shopDomain.includes(".")) {
        throw new Error("Please enter a valid Shopify domain (e.g., mystore.myshopify.com)")
      }

      const shopifyData = {
        user_id: userId,
        shop_domain: shopDomain,
        access_token: formData.access_token,
        is_active: true,
      }

      if (existingSettings) {
        const { error } = await supabase.from("shopify_settings").update(shopifyData).eq("user_id", userId)
      } else {
        const { error } = await supabase.from("shopify_settings").insert([shopifyData])
      }

      if (error) throw error

      // Refresh the page to show updated connection status
      window.location.reload()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to connect to Shopify")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("shopify_settings").update({ is_active: false }).eq("user_id", userId)

      if (error) throw error
      window.location.reload()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to disconnect")
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Shopify Store Connection
              {existingSettings?.is_active && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {existingSettings?.is_active
                ? `Connected to ${existingSettings.shop_domain}`
                : "Connect your Shopify store to sync comic listings"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {existingSettings?.is_active ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Store Connected</span>
              </div>
              <p className="text-sm text-green-600">Your Shopify store is connected and ready to sync comics.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect Store
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setFormData({
                    shop_domain: existingSettings.shop_domain,
                    access_token: existingSettings.access_token,
                  })
                }
              >
                Update Connection
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop_domain">Shop Domain</Label>
              <Input
                id="shop_domain"
                required
                value={formData.shop_domain}
                onChange={(e) => setFormData({ ...formData, shop_domain: e.target.value })}
                placeholder="mystore.myshopify.com"
              />
              <p className="text-xs text-muted-foreground">Enter your Shopify store domain (without https://)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Private App Access Token</Label>
              <Input
                id="access_token"
                type="password"
                required
                value={formData.access_token}
                onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                placeholder="shpat_..."
              />
              <p className="text-xs text-muted-foreground">
                Create a private app in your Shopify admin to get an access token
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isConnecting}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isConnecting ? "Connecting..." : "Connect Store"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
