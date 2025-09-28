import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ValueAnalyticsProps {
  userId: string
}

export async function ValueAnalytics({ userId }: ValueAnalyticsProps) {
  const supabase = await createClient()

  // Get comics with value data
  const { data: comics } = await supabase
    .from("comics")
    .select(`
      id,
      title,
      issue_number,
      acquired_price,
      current_value,
      created_at,
      publishers (name),
      series (title)
    `)
    .eq("user_id", userId)
    .not("current_value", "is", null)
    .not("acquired_price", "is", null)

  if (!comics || comics.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Value Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📈</span>
            <p className="text-muted-foreground">No value data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate value gains/losses
  const comicsWithGains = comics
    .map((comic) => ({
      ...comic,
      gain: (comic.current_value || 0) - (comic.acquired_price || 0),
      gainPercentage:
        comic.acquired_price && comic.acquired_price > 0
          ? (((comic.current_value || 0) - comic.acquired_price) / comic.acquired_price) * 100
          : 0,
    }))
    .sort((a, b) => b.gain - a.gain)

  const topGainers = comicsWithGains.slice(0, 5)
  const topLosers = comicsWithGains.slice(-5).reverse()

  const totalGain = comicsWithGains.reduce((sum, comic) => sum + comic.gain, 0)
  const totalAcquired = comics.reduce((sum, comic) => sum + (comic.acquired_price || 0), 0)
  const overallGainPercentage = totalAcquired > 0 ? ((totalGain / totalAcquired) * 100).toFixed(1) : "0"

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Value Analytics
          <Badge variant={totalGain >= 0 ? "secondary" : "destructive"} className="bg-green-100 text-green-700">
            {totalGain >= 0 ? "+" : ""}${totalGain.toLocaleString()} ({overallGainPercentage}%)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sm mb-3 text-green-600">Top Gainers</h4>
            <div className="space-y-3">
              {topGainers.map((comic) => (
                <div key={comic.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm line-clamp-1">
                      {comic.series?.title || comic.title}
                      {comic.issue_number && ` #${comic.issue_number}`}
                    </h5>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      +${comic.gain.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{comic.publishers?.name}</p>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span>Paid: ${comic.acquired_price}</span>
                    <span className="text-green-600">+{comic.gainPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3 text-red-600">Biggest Losses</h4>
            <div className="space-y-3">
              {topLosers.map((comic) => (
                <div key={comic.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm line-clamp-1">
                      {comic.series?.title || comic.title}
                      {comic.issue_number && ` #${comic.issue_number}`}
                    </h5>
                    <Badge variant="destructive" className="text-xs">
                      ${comic.gain.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{comic.publishers?.name}</p>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span>Paid: ${comic.acquired_price}</span>
                    <span className="text-red-600">{comic.gainPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
