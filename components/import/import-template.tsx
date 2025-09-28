"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ImportTemplate() {
  const templateFields = [
    { field: "title", required: true, description: "Comic title" },
    { field: "issue_number", required: false, description: "Issue number" },
    { field: "series_title", required: false, description: "Series name" },
    { field: "publisher_name", required: false, description: "Publisher name" },
    { field: "condition", required: false, description: "mint, near_mint, etc." },
    { field: "grade", required: false, description: "CGC/CBCS grade" },
    { field: "publication_date", required: false, description: "YYYY-MM-DD format" },
    { field: "cover_price", required: false, description: "Original cover price" },
    { field: "acquired_price", required: false, description: "Price you paid" },
    { field: "current_value", required: false, description: "Current market value" },
    { field: "for_sale", required: false, description: "true/false" },
    { field: "sale_price", required: false, description: "Selling price" },
    { field: "condition", required: false, description: "Physical condition" },
    { field: "location", required: false, description: "Storage location" },
    { field: "notes", required: false, description: "Additional notes" },
  ]

  const handleDownloadTemplate = () => {
    const headers = templateFields.map((field) => field.field).join(",")
    const sampleRow = [
      "The Amazing Spider-Man",
      "1",
      "The Amazing Spider-Man",
      "Marvel Comics",
      "near_mint",
      "CGC 9.2",
      "1963-03-01",
      "0.12",
      "5000.00",
      "8000.00",
      "true",
      "7500.00",
      "near_mint",
      "Box 1, Shelf A",
      "First appearance of Spider-Man",
    ].join(",")

    const csvContent = `${headers}\n${sampleRow}`
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "comic-import-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>CSV Template</CardTitle>
        <CardDescription>Required format for importing your comics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {templateFields.map((field, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-mono font-medium">{field.field}</span>
                  {field.required && <span className="text-destructive text-xs">*</span>}
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full bg-transparent">
            Download Template
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Required fields are marked with *</p>
          <p>• Use comma-separated values (CSV) format</p>
          <p>• First row must contain column headers</p>
          <p>• Date format: YYYY-MM-DD</p>
          <p>• Boolean values: true/false</p>
        </div>
      </CardContent>
    </Card>
  )
}
