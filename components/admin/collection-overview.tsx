import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CollectionOverviewProps {
  userId: string
}

export async function CollectionOverview({ userId }: CollectionOverviewProps) {
  const supabase = await createClient()

  // Get collection breakdown by publisher
  const { data: publisherStats } = await supabase
    .from("comics")
    .select(`
      id,
      current_value,
      publishers (name)
    `)
    .eq("user_id", userId)

  // Get condition breakdown
  const { data: conditionStats } = await supabase
    .from("comics")
    .select("condition, current_value")
    .eq("user_id", userId)

  // Process publisher data
  const publisherBreakdown = publisherStats?.reduce(
    (acc, comic) => {
      const publisher = comic.publishers?.name || "Unknown"
      if (!acc[publisher]) {
        acc[publisher] = { count: 0, value: 0 }
      }
      acc[publisher].count++
      acc[publisher].value += comic.current_value || 0
      return acc
    },
    {} as Record<string, { count: number; value: number }>,
  )

  // Process condition data
  const conditionBreakdown = conditionStats?.reduce(
    (acc, comic) => {
      const condition = comic.condition || "unknown"
      if (!acc[condition]) {
        acc[condition] = { count: 0, value: 0 }
      }
      acc[condition].count++
      acc[condition].value += comic.current_value || 0
      return acc
    },
    {} as Record<string, { count: number; value: number }>,
  )

  const totalComics = publisherStats?.length || 0
  const totalValue = publisherStats?.reduce((sum, comic) => sum + (comic.current_value || 0), 0) || 0

  const topPublishers = Object.entries(publisherBreakdown || {})
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)

  const conditionOrder = ["mint", "near_mint", "very_fine", "fine", "very_good", "good", "fair", "poor", "unknown"]
  const sortedConditions = Object.entries(conditionBreakdown || {}).sort(
    ([a], [b]) => conditionOrder.indexOf(a) - conditionOrder.indexOf(b),
  )

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Top Publishers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topPublishers.map(([publisher, stats]) => {
            const percentage = totalComics > 0 ? (stats.count / totalComics) * 100 : 0
            return (
              <div key={publisher} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{publisher}</span>
                  <div className="flex items-center gap-2">
                    <span>{stats.count} comics</span>
                    <Badge variant="outline">${stats.value.toLocaleString()}</Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of collection</div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Condition Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedConditions.map(([condition, stats]) => {
            const percentage = totalComics > 0 ? (stats.count / totalComics) * 100 : 0
            const conditionLabel = condition.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
            return (
              <div key={condition} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{conditionLabel}</span>
                  <div className="flex items-center gap-2">
                    <span>{stats.count} comics</span>
                    <Badge variant="outline">${stats.value.toLocaleString()}</Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of collection</div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
