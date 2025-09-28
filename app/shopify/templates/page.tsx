import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function ShopifyTemplatesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: templates } = await supabase
    .from("listing_templates")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Listing Templates
            </h1>
            <p className="text-muted-foreground mt-2">Manage templates for your Shopify product listings</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Link href="/shopify/templates/new">Create Template</Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {templates && templates.length > 0 ? (
            templates.map((template) => (
              <Card key={template.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {template.is_default && <Badge variant="secondary">Default</Badge>}
                      </CardTitle>
                      <CardDescription>
                        Product Type: {template.product_type} • Vendor: {template.vendor}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/shopify/templates/${template.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Title Template</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{template.title_template}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Description Template</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded line-clamp-3">
                        {template.description_template}
                      </p>
                    </div>
                    {template.tags_template && template.tags_template.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Default Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.tags_template.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-2">
              <CardContent className="text-center py-12">
                <span className="text-6xl mb-4 block">📝</span>
                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first listing template to standardize your Shopify product listings
                </p>
                <Button asChild>
                  <Link href="/shopify/templates/new">Create Template</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
