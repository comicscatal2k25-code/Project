"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/auth/role-guard"
import Link from "next/link"
import { Search, Plus, Upload, Download, Settings, User, LogOut, X, BarChart3, ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { UserRole, getRoleDisplayName } from "@/lib/auth-client"
import { ExportModal } from "@/components/comics/export-modal"
import { ImportModal } from "@/components/comics/import-modal"
import { SearchSuggestions } from "@/components/comics/search-suggestions"

export function ComicsHeader() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [shopifyEnabled, setShopifyEnabled] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function loadUserProfile() {
      try {
        // Get session from server-side cookie
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          window.location.href = "/auth/login"
          return
        }

        const user = await response.json()
        setUserRole(user.role as UserRole)
        setUserName(user.full_name || user.username || "User")
        setUserId(user.id)
        
        // Check if Shopify feature is enabled
        setShopifyEnabled(process.env.NEXT_PUBLIC_FEATURE_SHOPIFY === 'true')
      } catch (error) {
        console.error('Error loading user profile:', error)
        window.location.href = "/auth/login"
      }
    }

    loadUserProfile()
  }, [])

  // Sync search query with URL params
  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    } else {
      params.delete('search')
    }
    router.push(`/comics?${params.toString()}`)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('search', suggestion)
    router.push(`/comics?${params.toString()}`)
  }

  const clearSearch = () => {
    setSearchQuery("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    router.push(`/comics?${params.toString()}`)
  }


  const handleLogout = async () => {
    try {
      // Call logout API to clear the session cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    window.location.href = "/auth/login"
  }

  return (
    <div className="comic-panel bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white relative overflow-hidden">
      {/* Comic panel background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-sm"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-2 border-white rounded-sm"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-white rounded-sm"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-white rounded-sm"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-sm"></div>
      </div>
      
      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center border-4 border-white shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="comic-title text-3xl text-white">CC</span>
            </div>
            <div>
              <h1 className="comic-title text-3xl text-white">Panel & Pop!</h1>
              <p className="comic-body text-white/90 text-sm">Professional Comic Collection & Shopify Integration</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {userRole && (
              <Badge className="comic-badge bg-gradient-to-r from-yellow-400 to-red-500 text-white border-2 border-white shadow-lg">
                <User className="w-3 h-3 mr-1" />
                {getRoleDisplayName(userRole)}
              </Badge>
            )}
            
            <div className="text-right">
              <p className="comic-heading text-sm text-white">{userName}</p>
              <p className="comic-body text-xs text-white/80">Welcome back, Collector!</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="comic-button bg-white/20 hover:bg-white/30 text-white border-2 border-white/50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main header content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-2">
            <h2 className="comic-title text-4xl text-white">Shared Comics Collection</h2>
            <p className="comic-body text-white/90">Manage the shared comic collection and Shopify listings</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input 
                placeholder="Search comics..." 
                className="comic-filter pl-10 pr-10 bg-white/20 border-2 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-yellow-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(e.target.value.length > 0)
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Search Suggestions */}
              {showSuggestions && (
                <SearchSuggestions 
                  searchQuery={searchQuery}
                  onSuggestionClick={handleSuggestionClick}
                />
              )}
            </form>
            
            {/* Action buttons with role-based access */}
            <div className="flex gap-2 flex-wrap">
              {/* Add Comic button - only for admin and lister */}
              {userRole && ['admin', 'lister'].includes(userRole) && (
                <Button 
                  asChild 
                  className="comic-button bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-white border-2 border-white shadow-lg"
                >
                  <Link href="/comics/add">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Comic
                  </Link>
                </Button>
              )}

              {/* Import button - only for admin and lister */}
              {userRole && ['admin', 'lister'].includes(userRole) && (
                <div className="comic-button bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white border-2 border-white shadow-lg">
                  <ImportModal userId={userId} />
                </div>
              )}

              {/* Export button - only for admin, lister, and analyst */}
              {userRole && ['admin', 'lister', 'analyst'].includes(userRole) && (
                <div className="comic-button bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white border-2 border-white shadow-lg">
                  <ExportModal 
                    userId={userId} 
                    currentFilters={{
                      search: searchParams.get('search') || undefined,
                      condition: searchParams.get('condition') || undefined,
                      for_sale: searchParams.get('for_sale') || undefined,
                      publisher: searchParams.get('publisher') || undefined,
                    }}
                  />
                </div>
              )}

              {userRole && ['admin', 'analyst'].includes(userRole) && (
                <Button 
                  asChild
                  className="comic-button bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white border-2 border-white shadow-lg"
                >
                  <Link href="/analyst">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
              )}

              {/* Shopify button - only for admin and lister when feature is enabled */}
              {shopifyEnabled && userRole && ['admin', 'lister'].includes(userRole) && (
                <Button 
                  asChild
                  className="comic-button bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white border-2 border-white shadow-lg"
                >
                  <Link href="/shopify">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Shopify
                  </Link>
                </Button>
              )}

              {userRole === 'admin' && (
                <Button 
                  asChild
                  className="comic-button bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white border-2 border-white shadow-lg"
                >
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats will be rendered by ComicsStats component */}
      </div>
    </div>
  )
}
