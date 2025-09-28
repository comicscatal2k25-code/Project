import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsProps {
  userId: string
}

export async function DashboardStats({ userId }: DashboardStatsProps) {
  const supabase = await createClient()

  // Get collection stats
  const { data: totalComics } = await supabase.from("comics").select("id", { count: "exact" }).eq("user_id", userId)

  const { data: forSaleComics } = await supabase
    .from("comics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("for_sale", true)

  const { data: totalValueData } = await supabase.from("comics").select("current_value").eq("user_id", userId)

  const { data: acquiredValueData } = await supabase.from("comics").select("acquired_price").eq("user_id", userId)

  const totalValue = totalValueData?.reduce((sum, comic) => sum + (comic.current_value || 0), 0) || 0
  const acquiredValue = acquiredValueData?.reduce((sum, comic) => sum + (comic.acquired_price || 0), 0) || 0
  const valueGain = totalValue - acquiredValue

  const stats = [
    {
      title: "Total Comics",
      value: totalComics?.length || 0,
      icon: "📚",
      description: "In your collection",
    },
    {
      title: "For Sale",
      value: forSaleComics?.length || 0,
      icon: "🏷️",
      description: "Listed for sale",
    },
    {
      title: "Collection Value",
      value: `$${totalValue.toLocaleString()}`,
      icon: "💰",
      description: "Current estimated value",
    },
    {
      title: "Value Gain",
      value: `${valueGain >= 0 ? "+" : ""}$${valueGain.toLocaleString()}`,
      icon: valueGain >= 0 ? "📈" : "📉",
      description: "Since acquisition",
      positive: valueGain >= 0,
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
            <div
              className={`text-2xl font-bold ${stat.positive === false ? "text-destructive" : stat.positive === true ? "text-green-600" : ""}`}
            >
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
