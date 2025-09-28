"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/comics/image-upload"

interface EditComicPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditComicPage({ params }: EditComicPageProps) {
  const router = useRouter()
  const [comic, setComic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comicId, setComicId] = useState<string>("")

  useEffect(() => {
    async function loadComic() {
      const resolvedParams = await params
      setComicId(resolvedParams.id)
      
      try {
        // Get session first to ensure we're authenticated
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (!sessionResponse.ok) {
          console.error('Session validation failed')
          router.push("/auth/login")
          return
        }

        const sessionUser = await sessionResponse.json()
        console.log('Session user:', sessionUser)

        // Fetch the comic using the API
        const comicResponse = await fetch(`/api/comics/${resolvedParams.id}`, {
          credentials: 'include'
        })

        if (!comicResponse.ok) {
          if (comicResponse.status === 404) {
            setError("Comic not found")
          } else {
            setError("Failed to fetch comic")
          }
          return
        }

        const comicData = await comicResponse.json()
        setComic(comicData)
      } catch (err: any) {
        console.error("Error fetching comic:", err)
        setError(err.message || "An error occurred while loading the comic")
      }
      
      setLoading(false)
    }

    loadComic()
  }, [params, router])

  const handleSave = async () => {
    if (!comic) return
    
    setSaving(true)
    
    try {
      const response = await fetch(`/api/comics/${comicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: comic.title,
          series: comic.series,
          issue_number: comic.issue_number,
          publisher: comic.publisher,
          condition: comic.condition,
          grade: comic.grade,
          grading_service: comic.grading_service,
          current_value: comic.current_value,
          acquired_price: comic.acquired_price,
          for_sale: comic.for_sale,
          is_key_issue: comic.is_key_issue,
          key_issue_notes: comic.key_issue_notes,
          image_url: comic.image_url,
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update comic')
      }

      router.push(`/comics/${comicId}`)
    } catch (err: any) {
      console.error("Error updating comic:", err)
      setError(err.message || "An error occurred while saving")
    }
    
    setSaving(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setComic((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comic...</p>
        </div>
      </div>
    )
  }

  if (error || !comic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Comic not found"}</p>
          <Button asChild>
            <Link href="/comics">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Comics
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
                <Link href={`/comics/${comicId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Comic
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Comic</h1>
                <p className="text-white/80">Update comic details and metadata</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={comic.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Comic title"
                />
              </div>

              <div>
                <Label htmlFor="series">Series</Label>
                <Input
                  id="series"
                  value={comic.series || ""}
                  onChange={(e) => handleInputChange("series", e.target.value)}
                  placeholder="Series name"
                />
              </div>

              <div>
                <Label htmlFor="issue_number">Issue Number</Label>
                <Input
                  id="issue_number"
                  value={comic.issue_number || ""}
                  onChange={(e) => handleInputChange("issue_number", e.target.value)}
                  placeholder="Issue #"
                />
              </div>

              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={comic.publisher || ""}
                  onChange={(e) => handleInputChange("publisher", e.target.value)}
                  placeholder="Publisher name"
                />
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
                <Select value={comic.condition || ""} onValueChange={(value) => handleInputChange("condition", value)}>
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
                  value={comic.grade || ""}
                  onChange={(e) => handleInputChange("grade", parseFloat(e.target.value) || null)}
                  placeholder="Grade (e.g., 9.8)"
                />
              </div>

              <div>
                <Label htmlFor="grading_service">Grading Service</Label>
                <Select value={comic.grading_service || ""} onValueChange={(value) => handleInputChange("grading_service", value)}>
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
                  value={comic.current_value || ""}
                  onChange={(e) => handleInputChange("current_value", parseFloat(e.target.value) || null)}
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
                  value={comic.acquired_price || ""}
                  onChange={(e) => handleInputChange("acquired_price", parseFloat(e.target.value) || null)}
                  placeholder="Price you paid"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="for_sale"
                  checked={comic.for_sale || false}
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
                  checked={comic.is_key_issue || false}
                  onCheckedChange={(checked) => handleInputChange("is_key_issue", checked)}
                />
                <Label htmlFor="is_key_issue">Key Issue</Label>
              </div>

              <div>
                <Label htmlFor="key_issue_notes">Key Issue Notes</Label>
                <Textarea
                  id="key_issue_notes"
                  value={comic.key_issue_notes || ""}
                  onChange={(e) => handleInputChange("key_issue_notes", e.target.value)}
                  placeholder="Why is this a key issue?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="internal_notes">Internal Notes</Label>
                <Textarea
                  id="internal_notes"
                  value={comic.internal_notes || ""}
                  onChange={(e) => handleInputChange("internal_notes", e.target.value)}
                  placeholder="Personal notes about this comic"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <ImageUpload 
            comicId={comicId} 
            currentImageUrl={comic?.image_url}
            onImageUploaded={(url) => {
              setComic(prev => ({ ...prev, image_url: url }))
            }}
            onImageRemoved={() => {
              setComic(prev => ({ ...prev, image_url: null }))
            }}
          />
        </div>
      </div>
    </div>
  )
}