"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/comics/image-upload"

export default function AddComicPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comic, setComic] = useState({
    id: "",
    title: "",
    series: "",
    issue_number: "",
    publisher: "",
    condition: "",
    grade: "",
    current_value: "",
    acquired_price: "",
    inventory_quantity: "1",
    for_sale: false,
    is_key_issue: false,
    key_issue_notes: "",
    grading_service: "",
    era: "",
    tags: "",
    handle: "",
    product_type: "Comic Book",
    vendor: "",
    body_html: ""
  })
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get session first to ensure we're authenticated
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      
      if (!sessionResponse.ok) {
        setError("You must be logged in to add comics")
        setLoading(false)
        return
      }

      const sessionUser = await sessionResponse.json()
      console.log('Session user:', sessionUser)

      // Start with only the most basic columns that definitely exist
      const comicData: any = {
        user_id: sessionUser.id,
        title: comic.title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Add optional fields only if they have values
      if (comic.series) comicData.series = comic.series
      if (comic.issue_number) comicData.issue_number = comic.issue_number
      if (comic.publisher) comicData.publisher = comic.publisher
      if (comic.condition) comicData.condition = comic.condition
      if (comic.grade) comicData.grade = parseFloat(comic.grade)
      if (comic.grading_service) comicData.grading_service = comic.grading_service
      if (comic.current_value) comicData.current_value = parseFloat(comic.current_value)
      if (comic.acquired_price) comicData.acquired_price = parseFloat(comic.acquired_price)
      if (comic.inventory_quantity) comicData.inventory_quantity = parseInt(comic.inventory_quantity)
      if (comic.for_sale !== undefined) comicData.for_sale = comic.for_sale
      if (comic.is_key_issue !== undefined) comicData.is_key_issue = comic.is_key_issue
      if (comic.key_issue_notes) comicData.key_issue_notes = comic.key_issue_notes
      if (comic.era) comicData.era = comic.era
      if (comic.tags) comicData.tags = comic.tags.split(',').map(tag => tag.trim())
      if (comic.handle) comicData.handle = comic.handle
      if (comic.product_type) comicData.product_type = comic.product_type
      if (comic.vendor) comicData.vendor = comic.vendor
      if (comic.body_html) comicData.body_html = comic.body_html
      if (imageUrl) comicData.image_url = imageUrl

      let newComic
      let error

      if (comic.id) {
        // Update existing comic (if it was created for image upload)
        const response = await fetch(`/api/comics/${comic.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(comicData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update comic')
        }

        newComic = await response.json()
      } else {
        // Create new comic
        const response = await fetch('/api/comics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(comicData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create comic')
        }

        newComic = await response.json()
      }

      console.log("Comic saved successfully! ID:", newComic.id)
      // Set the comic ID so image upload can work
      setComic(prev => ({ ...prev, id: newComic.id }))
      // Show success message but don't redirect yet
      setError(null)
    } catch (err: any) {
      console.error("Error adding comic:", err)
      setError(err.message || "An error occurred while saving")
    }
    
    setLoading(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setComic((prev) => ({
      ...prev,
      [field]: value
    }))
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
                <h1 className="text-2xl font-bold">Add New Comic</h1>
                <p className="text-white/80">Add a new comic to your collection</p>
              </div>
            </div>
                <div className="flex gap-2">
                  {comic.id ? (
                    <Button
                      onClick={async () => {
                        // Save the comic with the current image URL before redirecting
                        if (imageUrl) {
                          setLoading(true)
                          try {
                            const response = await fetch(`/api/comics/${comic.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({ 
                                image_url: imageUrl,
                                updated_at: new Date().toISOString()
                              })
                            })

                            if (!response.ok) {
                              const errorData = await response.json()
                              throw new Error(errorData.error || 'Failed to update comic with image')
                            }

                            console.log("Comic updated with image URL:", imageUrl)
                          } catch (error) {
                            console.error("Error updating comic with image:", error)
                          } finally {
                            setLoading(false)
                          }
                        }
                        router.push("/comics")
                      }}
                      disabled={loading}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>{loading ? "Saving..." : "Done"}</span>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSave}
                      disabled={loading || !comic.title.trim()}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Save className="w-4 h-4" />
                          <span>Save Comic First</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Upload */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Comic Cover Image</h3>
                
                {imageUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden max-w-xs mx-auto">
                      <img 
                        src={imageUrl} 
                        alt="Comic cover" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setImageUrl(null)}
                      className="w-full max-w-xs mx-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center max-w-md mx-auto">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload a cover image for this comic</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={comic.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Comic title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="series">Series</Label>
                <Input
                  id="series"
                  value={comic.series}
                  onChange={(e) => handleInputChange("series", e.target.value)}
                  placeholder="Series name"
                />
              </div>

              <div>
                <Label htmlFor="issue_number">Issue Number</Label>
                <Input
                  id="issue_number"
                  value={comic.issue_number}
                  onChange={(e) => handleInputChange("issue_number", e.target.value)}
                  placeholder="Issue #"
                />
              </div>

              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={comic.publisher}
                  onChange={(e) => handleInputChange("publisher", e.target.value)}
                  placeholder="Publisher name"
                />
              </div>

              <div>
                <Label htmlFor="era">Era</Label>
                <Select value={comic.era} onValueChange={(value) => handleInputChange("era", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select era" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Golden Age">Golden Age</SelectItem>
                    <SelectItem value="Silver Age">Silver Age</SelectItem>
                    <SelectItem value="Bronze Age">Bronze Age</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Contemporary">Contemporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Condition & Grading */}
          <Card>
            <CardHeader>
              <CardTitle>Condition & Grading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={comic.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mint">Mint</SelectItem>
                    <SelectItem value="Near Mint">Near Mint</SelectItem>
                    <SelectItem value="Very Fine">Very Fine</SelectItem>
                    <SelectItem value="Fine">Fine</SelectItem>
                    <SelectItem value="Very Good">Very Good</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={comic.grade}
                  onChange={(e) => handleInputChange("grade", e.target.value)}
                  placeholder="Grade (e.g., 9.8)"
                />
              </div>

              <div>
                <Label htmlFor="grading_service">Grading Service</Label>
                <Select value={comic.grading_service} onValueChange={(value) => handleInputChange("grading_service", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grading service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CGC">CGC</SelectItem>
                    <SelectItem value="CBCS">CBCS</SelectItem>
                    <SelectItem value="PGX">PGX</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current_value">Current Value ($)</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={comic.current_value}
                  onChange={(e) => handleInputChange("current_value", e.target.value)}
                  placeholder="Current market value"
                />
              </div>

              <div>
                <Label htmlFor="acquired_price">Acquired Price ($)</Label>
                <Input
                  id="acquired_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={comic.acquired_price}
                  onChange={(e) => handleInputChange("acquired_price", e.target.value)}
                  placeholder="Price you paid"
                />
              </div>

              <div>
                <Label htmlFor="inventory_quantity">Quantity</Label>
                <Input
                  id="inventory_quantity"
                  type="number"
                  min="1"
                  value={comic.inventory_quantity}
                  onChange={(e) => handleInputChange("inventory_quantity", e.target.value)}
                  placeholder="Quantity"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="for_sale"
                  checked={comic.for_sale}
                  onCheckedChange={(checked) => handleInputChange("for_sale", checked)}
                />
                <Label htmlFor="for_sale">For Sale</Label>
              </div>
            </CardContent>
          </Card>

          {/* Key Issue & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Key Issue & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_key_issue"
                  checked={comic.is_key_issue}
                  onCheckedChange={(checked) => handleInputChange("is_key_issue", checked)}
                />
                <Label htmlFor="is_key_issue">Key Issue</Label>
              </div>

              <div>
                <Label htmlFor="key_issue_notes">Key Issue Notes</Label>
                <Textarea
                  id="key_issue_notes"
                  value={comic.key_issue_notes}
                  onChange={(e) => handleInputChange("key_issue_notes", e.target.value)}
                  placeholder="Why is this a key issue?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={comic.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="Comma-separated tags"
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Comic Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              {!comic.id ? (
                <div className="text-center py-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="text-4xl mb-4">📸</div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Save Comic First</h3>
                  <p className="text-yellow-700">
                    Please save the comic details first, then you can upload a cover image.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                      ✅ Comic saved! ID: {comic.id} - You can now upload an image.
                    </p>
                  </div>
                  <ImageUpload 
                    comicId={comic.id} 
                    currentImageUrl={imageUrl}
                    onImageUploaded={(url) => {
                      console.log("Image uploaded successfully:", url)
                      setImageUrl(url)
                    }}
                    onImageRemoved={() => setImageUrl(null)}
                  />
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">
                      🔍 Debug: Comic ID is {comic.id} - Check console for upload logs
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}