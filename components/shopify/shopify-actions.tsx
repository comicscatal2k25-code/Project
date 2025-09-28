"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ShopifyActionsProps {
  userId: string
}

export function ShopifyActions({ userId }: ShopifyActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleBulkSync = async () => {
    setIsLoading("bulk-sync")
    const supabase = createClient()

    try {
      // Create a job for bulk sync
      const { error } = await supabase.from("job_queue").insert([
        {
          user_id: userId,
          job_type: "shopify_sync",
          payload: { action: "bulk_sync", sync_all_for_sale: true },
          priority: 1,
        },
      ])

      if (error) throw error

      // Refresh to show the job status
      router.refresh()
    } catch (error) {
      console.error("Failed to start bulk sync:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleSyncSelected = async () => {
    setIsLoading("sync-selected")
    // This would typically open a modal to select comics
    // For now, we'll just show a placeholder
    setTimeout(() => setIsLoading(null), 2000)
  }

  const actions = [
    {
      title: "Bulk Sync All",
      description: "Sync all comics marked for sale",
      action: handleBulkSync,
      loading: isLoading === "bulk-sync",
      icon: "🔄",
      variant: "default" as const,
    },
    {
      title: "Sync Selected",
      description: "Choose specific comics to sync",
      action: handleSyncSelected,
      loading: isLoading === "sync-selected",
      icon: "✅",
      variant: "outline" as const,
    },
    {
      title: "Listing Templates",
      description: "Manage Shopify listing templates",
      action: () => router.push("/shopify/templates"),
      loading: false,
      icon: "📝",
      variant: "outline" as const,
    },
    {
      title: "Sync History",
      description: "View sync logs and errors",
      action: () => router.push("/shopify/history"),
      loading: false,
      icon: "📊",
      variant: "outline" as const,
    },
  ]

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Sync Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start h-auto p-4"
            onClick={action.action}
            disabled={action.loading}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{action.icon}</span>
              <div className="text-left">
                <div className="font-medium">{action.loading ? "Processing..." : action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
