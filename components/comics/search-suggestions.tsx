"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"

interface SearchSuggestionsProps {
  searchQuery: string
  onSuggestionClick: (suggestion: string) => void
}

export function SearchSuggestions({ searchQuery, onSuggestionClick }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    // Generate suggestions based on common comic terms
    const commonTerms = [
      'Batman', 'Superman', 'Spider-Man', 'X-Men', 'Avengers', 'Wonder Woman',
      'Marvel', 'DC Comics', 'Golden Age', 'Silver Age', 'Bronze Age', 'Modern',
      'Mint', 'Near Mint', 'Very Fine', 'Fine', 'Very Good', 'Good',
      'CGC', 'PGX', 'CBCS', 'Key Issue', 'First Appearance', 'Variant Cover'
    ]

    const filteredSuggestions = commonTerms
      .filter(term => 
        term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes(term.toLowerCase())
      )
      .slice(0, 5)

    setSuggestions(filteredSuggestions)
  }, [searchQuery])

  if (suggestions.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-2 px-2">Suggestions:</div>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm"
          >
            <Search className="h-3 w-3 text-gray-400" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
