import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminStatsProps {
  userId: string
}

export async function AdminStats({ userId }: AdminStatsProps) {
  const supabase = await createClient()

  // Get comprehensive collection statistics
  const { data: totalComics } = await supabase.from("comics").select("id", { count: "exact" }).eq("user_id", userId)

  const { data: totalValue } = await supabase.from("comics").select("current_value").eq("user_id", userId)

  const { data: acquiredValue } = await supabase.from("comics").select("acquired_price").eq("user_id", userId)

  const { data: forSaleComics } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("for_sale", true)

  const { data: shopifySynced } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .not("shopify_product_id", "is", null)

  const { data: recentlyAdded } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const currentValue = totalValue?.reduce((sum, comic) => sum + (comic.current_value || 0), 0) || 0
  const totalAcquired = acquiredValue?.reduce((sum, comic) => sum + (comic.acquired_price || 0), 0) || 0
  const valueGain = currentValue - totalAcquired
  const valueGainPercentage = totalAcquired > 0 ? ((valueGain / totalAcquired) * 100).toFixed(1) : "0"

  const stats = [
    {
      title: "Total Comics",
      value: totalComics?.length || 0,
      icon: "📚",
      description: "In collection",
      trend: `+${recentlyAdded?.length || 0} this month`,
    },
    {
      title: "Collection Value",
      value: `$${currentValue.toLocaleString()}`,
      icon: "💰",
      description: "Current market value",
      trend: `${valueGain >= 0 ? "+" : ""}${valueGainPercentage}% gain`,
      positive: valueGain >= 0,
    },
    {
      title: "For Sale",
      value: forSaleComics?.length || 0,
      icon: "🏷️",
      description: "Listed for sale",
      trend: `${shopifySynced?.length || 0} synced to Shopify`,
    },
    {
      title: "Avg. Value",
      value: `$${totalComics?.length ? Math.round(currentValue / totalComics.length) : 0}`,
      icon: "📊",
      description: "Per comic",
      trend: "Market average",
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
            <p
              className={`text-xs mt-1 ${stat.positive === false ? "text-destructive" : stat.positive === true ? "text-green-600" : "text-muted-foreground"}`}
            >
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
