import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface RecentComicsProps {
  userId: string
}

export async function RecentComics({ userId }: RecentComicsProps) {
  const supabase = await createClient()

  const { data: recentComics } = await supabase
    .from("comics")
    .select(`
      id,
      title,
      issue_number,
      condition,
      current_value,
      for_sale,
      created_at,
      publishers (name),
      series (title)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Recent Additions</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/comics">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentComics && recentComics.length > 0 ? (
          <div className="space-y-4">
            {recentComics.map((comic) => (
              <div
                key={comic.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium">
                    {comic.series?.title || comic.title}
                    {comic.issue_number && ` #${comic.issue_number}`}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {comic.publishers?.name} • {comic.condition}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {comic.for_sale && <Badge variant="secondary">For Sale</Badge>}
                  {comic.current_value && <span className="font-medium text-green-600">${comic.current_value}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📚</span>
            <p className="text-muted-foreground mb-4">No comics in your collection yet</p>
            <Button asChild>
              <Link href="/comics/add">Add Your First Comic</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
