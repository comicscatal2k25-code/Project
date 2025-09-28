import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ShopifyStatsProps {
  userId: string
}

export async function ShopifyStats({ userId }: ShopifyStatsProps) {
  const supabase = await createClient()

  // Get sync statistics
  const { data: syncedComics } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .not("shopify_product_id", "is", null)

  const { data: pendingComics } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("for_sale", true)
    .is("shopify_product_id", null)

  const { data: recentSyncs } = await supabase
    .from("shopify_sync_logs")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { data: failedSyncs } = await supabase
    .from("shopify_sync_logs")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "error")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const stats = [
    {
      title: "Synced Comics",
      value: syncedComics?.length || 0,
      icon: "🔄",
      description: "Comics synced to Shopify",
    },
    {
      title: "Pending Sync",
      value: pendingComics?.length || 0,
      icon: "⏳",
      description: "Comics marked for sale",
    },
    {
      title: "Successful Syncs",
      value: recentSyncs?.length || 0,
      icon: "✅",
      description: "Last 24 hours",
    },
    {
      title: "Failed Syncs",
      value: failedSyncs?.length || 0,
      icon: "❌",
      description: "Last 24 hours",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
