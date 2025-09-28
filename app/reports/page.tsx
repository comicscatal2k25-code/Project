import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const reports = [
    {
      title: "Collection Summary",
      description: "Complete overview of your comic collection with statistics and breakdowns",
      icon: "📊",
      href: "/reports/collection-summary",
    },
    {
      title: "Value Report",
      description: "Detailed analysis of collection value, gains, and investment performance",
      icon: "💰",
      href: "/reports/value-analysis",
    },
    {
      title: "Publisher Analysis",
      description: "Breakdown by publisher with market share and value distribution",
      icon: "🏢",
      href: "/reports/publisher-analysis",
    },
    {
      title: "Condition Report",
      description: "Analysis of comic conditions and their impact on collection value",
      icon: "⭐",
      href: "/reports/condition-analysis",
    },
    {
      title: "Sales Performance",
      description: "Track your sales history and Shopify integration performance",
      icon: "🛒",
      href: "/reports/sales-performance",
    },
    {
      title: "Import/Export Log",
      description: "History of all bulk operations and data management activities",
      icon: "📥",
      href: "/reports/import-export-log",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Comprehensive insights into your comic collection</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                    {report.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full group-hover:bg-primary/90">
                  <Link href={report.href}>Generate Report</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
