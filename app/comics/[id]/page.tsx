import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/auth/role-guard"
import { ComicImage } from "@/components/ui/comic-image"
import Link from "next/link"
import { ArrowLeft, Edit, Star, DollarSign, Calendar, Award, Eye, Plus, BookOpen, User, Tag } from "lucide-react"
import { cookies } from "next/headers"

interface ComicDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ComicDetailPage({ params }: ComicDetailPageProps) {
  const { id } = await params

  // Get session from cookie
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) {
    redirect("/auth/login")
  }

  let sessionData
  try {
    sessionData = JSON.parse(atob(sessionToken))
  } catch (error) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch the specific comic - all users can view all comics (shared catalog)
  const { data: comic, error: comicError } = await supabase
    .from("comics")
    .select("*")
    .eq("id", id)
    .single()

  if (comicError || !comic) {
    redirect("/comics")
  }

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      'Mint': 'bg-green-100 text-green-800 border-green-200',
      'Near Mint': 'bg-green-100 text-green-800 border-green-200',
      'Very Fine': 'bg-blue-100 text-blue-800 border-blue-200',
      'Fine': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Very Good': 'bg-orange-100 text-orange-800 border-orange-200',
      'Good': 'bg-red-100 text-red-800 border-red-200',
      'Fair': 'bg-red-100 text-red-800 border-red-200',
      'Poor': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[condition] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEraColor = (era: string) => {
    const colors: Record<string, string> = {
      'Golden Age': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Silver Age': 'bg-blue-100 text-blue-800 border-blue-200',
      'Bronze Age': 'bg-orange-100 text-orange-800 border-orange-200',
      'Modern': 'bg-purple-100 text-purple-800 border-purple-200',
      'Contemporary': 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[era] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
                <Link href="/comics">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Comics
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{comic.title}</h1>
                <p className="text-white/80 text-sm">Comic Details</p>
              </div>
            </div>
            
            <RoleGuard allowedRoles={['admin', 'lister']}>
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Link href={`/comics/${comic.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Comic
                </Link>
              </Button>
            </RoleGuard>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Comic Cover */}
          <div className="lg:col-span-1">
            <Card className="comic-panel bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="comic-cover aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300 shadow-lg">
                  <ComicImage 
                    src={(comic as any).image_url} 
                    alt={`${comic.title} cover`}
                    title={comic.title}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comic Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title</label>
                    <p className="text-lg font-semibold">{comic.title}</p>
                  </div>
                  {(comic as any).series && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Series</label>
                      <p className="text-lg font-semibold">{(comic as any).series}</p>
                    </div>
                  )}
                  {comic.issue_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Issue Number</label>
                      <p className="text-lg font-semibold">#{comic.issue_number}</p>
                    </div>
                  )}
                  {(comic as any).printing_suffix && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Printing Suffix</label>
                      <p className="text-lg font-semibold">{(comic as any).printing_suffix}</p>
                    </div>
                  )}
                  {(comic as any).publisher && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Publisher</label>
                      <p className="text-lg font-semibold">{(comic as any).publisher}</p>
                    </div>
                  )}
                  {(comic as any).era && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Era</label>
                      <Badge className={`${getEraColor((comic as any).era)}`}>
                        {(comic as any).era}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Condition & Grading */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Condition & Grading
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(comic as any).condition && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition</label>
                      <div className="mt-1">
                        <Badge className={`${getConditionColor((comic as any).condition)}`}>
                          {(comic as any).condition}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {(comic as any).grade && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Grade</label>
                      <p className="text-lg font-semibold">{(comic as any).grade}</p>
                    </div>
                  )}
                  {(comic as any).grading_service && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Grading Service</label>
                      <p className="text-lg font-semibold">{(comic as any).grading_service}</p>
                    </div>
                  )}
                  {(comic as any).slab_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Slab ID</label>
                      <p className="text-lg font-semibold">{(comic as any).slab_id}</p>
                    </div>
                  )}
                </div>
                
                {/* Key Issue Badge */}
                {(comic as any).is_key_issue && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-700">Key Issue</span>
                    {(comic as any).key_issue_notes && (
                      <p className="text-sm text-gray-600">{(comic as any).key_issue_notes}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(comic as any).current_value && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Value</label>
                      <p className="text-2xl font-bold text-green-600">
                        ${(comic as any).current_value.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(comic as any).acquired_price && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Acquired Price</label>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(comic as any).acquired_price.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(comic as any).compare_at_price && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Compare At Price</label>
                      <p className="text-2xl font-bold text-purple-600">
                        ${(comic as any).compare_at_price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(comic as any).inventory_quantity && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Inventory Quantity</label>
                      <p className="text-lg font-semibold">{(comic as any).inventory_quantity}</p>
                    </div>
                  )}
                  {(comic as any).barcode && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Barcode</label>
                      <p className="text-lg font-semibold">{(comic as any).barcode}</p>
                    </div>
                  )}
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {(comic as any).for_sale && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Tag className="w-3 h-3 mr-1" />
                      For Sale
                    </Badge>
                  )}
                  {(comic as any).published_to_shopify && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Eye className="w-3 h-3 mr-1" />
                      Published to Shopify
                    </Badge>
                  )}
                  {(comic as any).published && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Eye className="w-3 h-3 mr-1" />
                      Published
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shopify Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Shopify Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(comic as any).handle && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Handle (URL Slug)</label>
                      <p className="text-lg font-semibold">{(comic as any).handle}</p>
                    </div>
                  )}
                  {(comic as any).product_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Product Type</label>
                      <p className="text-lg font-semibold">{(comic as any).product_type}</p>
                    </div>
                  )}
                  {(comic as any).vendor && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vendor</label>
                      <p className="text-lg font-semibold">{(comic as any).vendor}</p>
                    </div>
                  )}
                  {(comic as any).tags && (comic as any).tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(comic as any).tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {(comic as any).body_html && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <div 
                      className="mt-1 text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: (comic as any).body_html }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(comic as any).release_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Release Date</label>
                      <p className="text-lg font-semibold">
                        {new Date((comic as any).release_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {(comic as any).cover_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cover Date</label>
                      <p className="text-lg font-semibold">
                        {new Date((comic as any).cover_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Added to Collection</label>
                    <p className="text-lg font-semibold">
                      {new Date(comic.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-lg font-semibold">
                      {new Date(comic.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
