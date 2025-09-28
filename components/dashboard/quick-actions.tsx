import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Add Comic",
      description: "Add a new comic to your collection",
      href: "/comics/add",
      icon: "➕",
      variant: "default" as const,
    },
    {
      title: "Import Comics",
      description: "Bulk import from CSV file",
      href: "/import",
      icon: "📥",
      variant: "outline" as const,
    },
    {
      title: "Sync to Shopify",
      description: "Update your store listings",
      href: "/shopify",
      icon: "🔄",
      variant: "outline" as const,
    },
    {
      title: "View Reports",
      description: "Collection analytics",
      href: "/reports",
      icon: "📊",
      variant: "outline" as const,
    },
  ]

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button key={index} asChild variant={action.variant} className="w-full justify-start h-auto p-4">
            <Link href={action.href}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{action.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
