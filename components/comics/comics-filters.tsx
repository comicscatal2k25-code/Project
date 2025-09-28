"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function ComicsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [condition, setCondition] = useState("")
  const [publisher, setPublisher] = useState("")
  const [forSale, setForSale] = useState(false)
  const [shopifySynced, setShopifySynced] = useState(false)

  const conditions = [
    { value: "Mint", label: "Mint" },
    { value: "Near Mint", label: "Near Mint" },
    { value: "Very Fine", label: "Very Fine" },
    { value: "Fine", label: "Fine" },
    { value: "Very Good", label: "Very Good" },
    { value: "Good", label: "Good" },
    { value: "Fair", label: "Fair" },
    { value: "Poor", label: "Poor" }
  ]

  // Sync with URL parameters on mount
  useEffect(() => {
    const urlCondition = searchParams.get('condition') || ""
    const urlPublisher = searchParams.get('publisher') || ""
    const urlForSale = searchParams.get('for_sale') === 'true'
    const urlShopifySynced = searchParams.get('shopify_synced') === 'true'

    setCondition(urlCondition)
    setPublisher(urlPublisher)
    setForSale(urlForSale)
    setShopifySynced(urlShopifySynced)
  }, [searchParams])

  const updateURL = (newParams: Record<string, string | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "" || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    router.push(`/comics?${params.toString()}`)
  }

  const handleConditionChange = (value: string) => {
    setCondition(value)
    updateURL({ condition: value === "all" ? null : value })
  }

  const handlePublisherChange = (value: string) => {
    setPublisher(value)
    updateURL({ publisher: value === "" ? null : value })
  }

  const handleForSaleChange = (checked: boolean) => {
    setForSale(checked)
    updateURL({ for_sale: checked ? true : null })
  }

  const handleShopifySyncedChange = (checked: boolean) => {
    setShopifySynced(checked)
    updateURL({ shopify_synced: checked ? true : null })
  }

  const clearAllFilters = () => {
    setCondition("")
    setPublisher("")
    setForSale(false)
    setShopifySynced(false)
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('condition')
    params.delete('publisher')
    params.delete('for_sale')
    params.delete('shopify_synced')
    
    router.push(`/comics?${params.toString()}`)
  }

  const hasActiveFilters = condition || publisher || forSale || shopifySynced

  return (
    <div className="comic-filter bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="comic-heading text-xl text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="comic-button bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white border-2 border-red-600"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap items-end gap-4">
        {/* Condition Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label className="comic-body text-sm font-bold mb-2 block text-gray-800">Condition</Label>
          <Select value={condition} onValueChange={handleConditionChange}>
            <SelectTrigger className="comic-filter w-full border-2 border-gray-300 focus:border-yellow-400">
              <SelectValue placeholder="Any condition" />
            </SelectTrigger>
            <SelectContent className="comic-panel">
              <SelectItem value="all">Any condition</SelectItem>
              {conditions.map((condition) => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Publisher Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label className="comic-body text-sm font-bold mb-2 block text-gray-800">Publisher</Label>
          <Input
            placeholder="Enter publisher name..."
            value={publisher}
            onChange={(e) => handlePublisherChange(e.target.value)}
            className="comic-filter w-full border-2 border-gray-300 focus:border-yellow-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex-1 min-w-[200px]">
          <Label className="comic-body text-sm font-bold mb-2 block text-gray-800">Status</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="for-sale" 
                checked={forSale}
                onCheckedChange={handleForSaleChange}
                className="border-2 border-gray-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-500"
              />
              <Label htmlFor="for-sale" className="comic-body text-sm font-bold text-gray-800">
                For Sale
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="shopify-synced" 
                checked={shopifySynced}
                onCheckedChange={handleShopifySyncedChange}
                className="border-2 border-gray-400 data-[state=checked]:bg-teal-400 data-[state=checked]:border-teal-500"
              />
              <Label htmlFor="shopify-synced" className="comic-body text-sm font-bold text-gray-800">
                Synced to Shopify
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t-2 border-gray-300">
          <div className="flex flex-wrap gap-2">
            <span className="comic-body text-sm font-bold text-gray-800">Active:</span>
            {condition && (
              <span className="comic-badge inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white border-2 border-blue-600">
                Condition: {condition}
              </span>
            )}
            {publisher && (
              <span className="comic-badge inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white border-2 border-green-600">
                Publisher: {publisher}
              </span>
            )}
            {forSale && (
              <span className="comic-badge inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-2 border-yellow-600">
                For Sale
              </span>
            )}
            {shopifySynced && (
              <span className="comic-badge inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-400 to-purple-500 text-white border-2 border-purple-600">
                Shopify Synced
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
