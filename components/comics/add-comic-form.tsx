"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface AddComicFormProps {
  userId: string
  publishers: Array<{ id: string; name: string }>
  series: Array<{ id: string; title: string; publishers: { name: string } | null }>
}

export function AddComicForm({ userId, publishers, series }: AddComicFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    issue_number: "",
    variant: "",
    series_id: "",
    publisher_id: "",
    publication_date: "",
    condition: "",
    grade: "",
    cover_price: "",
    acquired_price: "",
    current_value: "",
    description: "",
    notes: "",
    location: "",
    for_sale: false,
    sale_price: "",
  })

  const conditions = [
    { value: "mint", label: "Mint" },
    { value: "near_mint", label: "Near Mint" },
    { value: "very_fine", label: "Very Fine" },
    { value: "fine", label: "Fine" },
    { value: "very_good", label: "Very Good" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const comicData = {
        user_id: userId,
        title: formData.title,
        issue_number: formData.issue_number || null,
        variant: formData.variant || null,
        series_id: formData.series_id || null,
        publisher_id: formData.publisher_id || null,
        publication_date: formData.publication_date || null,
        condition: formData.condition || null,
        grade: formData.grade || null,
        cover_price: formData.cover_price ? Number.parseFloat(formData.cover_price) : null,
        acquired_price: formData.acquired_price ? Number.parseFloat(formData.acquired_price) : null,
        current_value: formData.current_value ? Number.parseFloat(formData.current_value) : null,
        description: formData.description || null,
        notes: formData.notes || null,
        location: formData.location || null,
        for_sale: formData.for_sale,
        sale_price: formData.sale_price ? Number.parseFloat(formData.sale_price) : null,
      }

      const { error } = await supabase.from("comics").insert([comicData])

      if (error) throw error

      router.push("/comics")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Comic Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Comic title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_number">Issue Number</Label>
              <Input
                id="issue_number"
                value={formData.issue_number}
                onChange={(e) => setFormData({ ...formData, issue_number: e.target.value })}
                placeholder="1, 2, Annual 1, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="series_id">Series</Label>
              <Select
                value={formData.series_id}
                onValueChange={(value) => setFormData({ ...formData, series_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select series" />
                </SelectTrigger>
                <SelectContent>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} ({s.publishers?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher_id">Publisher</Label>
              <Select
                value={formData.publisher_id}
                onValueChange={(value) => setFormData({ ...formData, publisher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select publisher" />
                </SelectTrigger>
                <SelectContent>
                  {publishers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="CGC 9.8, CBCS 9.6, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication_date">Publication Date</Label>
              <Input
                id="publication_date"
                type="date"
                value={formData.publication_date}
                onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cover_price">Cover Price ($)</Label>
              <Input
                id="cover_price"
                type="number"
                step="0.01"
                value={formData.cover_price}
                onChange={(e) => setFormData({ ...formData, cover_price: e.target.value })}
                placeholder="3.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquired_price">Acquired Price ($)</Label>
              <Input
                id="acquired_price"
                type="number"
                step="0.01"
                value={formData.acquired_price}
                onChange={(e) => setFormData({ ...formData, acquired_price: e.target.value })}
                placeholder="5.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value ($)</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="10.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the comic"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Box 1, Shelf A, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Input
                id="variant"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                placeholder="Variant cover description"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="for_sale"
              checked={formData.for_sale}
              onCheckedChange={(checked) => setFormData({ ...formData, for_sale: checked as boolean })}
            />
            <Label htmlFor="for_sale">List for sale</Label>
          </div>

          {formData.for_sale && (
            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price ($)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                placeholder="15.00"
              />
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isLoading ? "Adding..." : "Add Comic"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
