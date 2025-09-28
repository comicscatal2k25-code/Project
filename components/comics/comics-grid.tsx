"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/auth/role-guard"
import { ComicImage } from "@/components/ui/comic-image"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import Link from "next/link"
import { Edit, Star, DollarSign, Calendar, Award, Eye, Plus, X, Trash2, Upload } from "lucide-react"
import { useState, useEffect } from "react"

interface ComicsGridProps {
  userId: string
  searchParams: {
    search?: string
    condition?: string
    for_sale?: string
    publisher?: string
    shopify_synced?: string
    page?: string
  }
}

export function ComicsGrid({ userId, searchParams }: ComicsGridProps) {
  const [comics, setComics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    comicId: string | null
    comicTitle: string
    loading: boolean
  }>({
    isOpen: false,
    comicId: null,
    comicTitle: "",
    loading: false
  })
  const [publishDialog, setPublishDialog] = useState<{
    isOpen: boolean
    comicId: string | null
    comicTitle: string
    loading: boolean
  }>({
    isOpen: false,
    comicId: null,
    comicTitle: "",
    loading: false
  })
  const [storeSelectionDialog, setStoreSelectionDialog] = useState<{
    isOpen: boolean
    comicId: string | null
    comicTitle: string
    stores: any[]
    loading: boolean
  }>({
    isOpen: false,
    comicId: null,
    comicTitle: "",
    stores: [],
    loading: false
  })
  const [shopifyEnabled, setShopifyEnabled] = useState(false)

  useEffect(() => {
    async function fetchComics() {
      try {
        // Get session first to ensure we're authenticated
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (!sessionResponse.ok) {
          console.error('Session validation failed')
          setError('Authentication failed')
          return
        }

        const sessionUser = await sessionResponse.json()
        console.log('Session user:', sessionUser)
        setCurrentUser(sessionUser)

        // Check if Shopify feature is enabled
        setShopifyEnabled(process.env.NEXT_PUBLIC_FEATURE_SHOPIFY === 'true')

        // Build query parameters for search and filters
        const queryParams = new URLSearchParams()
        
        if (searchParams.search) {
          queryParams.set('search', searchParams.search)
        }
        if (searchParams.condition) {
          queryParams.set('condition', searchParams.condition)
        }
        if (searchParams.publisher) {
          queryParams.set('publisher', searchParams.publisher)
        }
        if (searchParams.for_sale) {
          queryParams.set('for_sale', searchParams.for_sale)
        }
        if (searchParams.shopify_synced) {
          queryParams.set('shopify_synced', searchParams.shopify_synced)
        }

        // Create a fetch request to get comics with search parameters
        const comicsResponse = await fetch(`/api/comics?${queryParams.toString()}`, {
          credentials: 'include'
        })

        if (!comicsResponse.ok) {
          throw new Error('Failed to fetch comics')
        }

        const comicsData = await comicsResponse.json()
        console.log("Comics loaded:", comicsData?.length || 0, "comics")
        setComics(comicsData || [])
      } catch (err: any) {
        console.error("Error fetching comics:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchComics()
  }, [userId, searchParams])

  const handleDeleteClick = (comicId: string, comicTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      comicId,
      comicTitle,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.comicId) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/comics/${deleteDialog.comicId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete comic')
      }

      // Remove from local state
      setComics(prev => prev.filter(comic => comic.id !== deleteDialog.comicId))
      setDeleteDialog({
        isOpen: false,
        comicId: null,
        comicTitle: "",
        loading: false
      })
    } catch (err) {
      console.error('Error deleting comic:', err)
      alert('Error deleting comic: ' + (err as Error).message)
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      comicId: null,
      comicTitle: "",
      loading: false
    })
  }

  const handlePublishClick = async (comicId: string, comicTitle: string) => {
    setStoreSelectionDialog({
      isOpen: true,
      comicId,
      comicTitle,
      stores: [],
      loading: true
    })

    try {
      // Fetch available store connections
      const connectionsResponse = await fetch('/api/shopify/connections', {
        credentials: 'include'
      })

      if (!connectionsResponse.ok) {
        throw new Error('Failed to fetch store connections')
      }

      const connectionsData = await connectionsResponse.json()
      const connections = connectionsData.data || []

      if (connections.length === 0) {
        alert('No Shopify stores connected. Please connect a store first.')
        setStoreSelectionDialog({
          isOpen: false,
          comicId: null,
          comicTitle: "",
          stores: [],
          loading: false
        })
        return
      }

      setStoreSelectionDialog(prev => ({
        ...prev,
        stores: connections,
        loading: false
      }))
    } catch (err) {
      console.error('Error fetching store connections:', err)
      alert('Error fetching store connections: ' + (err as Error).message)
      setStoreSelectionDialog({
        isOpen: false,
        comicId: null,
        comicTitle: "",
        stores: [],
        loading: false
      })
    }
  }

  const handlePublishConfirm = async (storeConnectionId: string) => {
    if (!storeSelectionDialog.comicId) return

    setStoreSelectionDialog(prev => ({ ...prev, loading: true }))

    try {
      // Publish the comic to the selected store
      const publishResponse = await fetch('/api/shopify/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          store_connection_id: storeConnectionId,
          product_variant_ids: [storeSelectionDialog.comicId],
          publishMode: 'api_publish'
        })
      })

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json()
        throw new Error(errorData.error || 'Failed to publish comic')
      }

      const publishData = await publishResponse.json()
      
      alert(`Comic "${storeSelectionDialog.comicTitle}" has been queued for publishing to Shopify!`)
      
      setStoreSelectionDialog({
        isOpen: false,
        comicId: null,
        comicTitle: "",
        stores: [],
        loading: false
      })
    } catch (err) {
      console.error('Error publishing comic:', err)
      alert('Error publishing comic: ' + (err as Error).message)
    } finally {
      setStoreSelectionDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handlePublishCancel = () => {
    setPublishDialog({
      isOpen: false,
      comicId: null,
      comicTitle: "",
      loading: false
    })
  }

  const handleStoreSelectionCancel = () => {
    setStoreSelectionDialog({
      isOpen: false,
      comicId: null,
      comicTitle: "",
      stores: [],
      loading: false
    })
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

  // Check if user can edit a specific comic
  const canEditComic = (comic: any) => {
    if (!currentUser) return false
    
    // Admin can edit all comics
    if (currentUser.role === 'admin') return true
    
    // Lister can edit all comics (not just their own)
    if (currentUser.role === 'lister') return true
    
    // Analyst and Viewer cannot edit comics
    return false
  }

  // Check if user can delete a specific comic
  const canDeleteComic = (comic: any) => {
    if (!currentUser) return false
    
    // Only admin can delete comics
    return currentUser.role === 'admin'
  }

  // Check if user can publish a specific comic to Shopify
  const canPublishComic = (comic: any) => {
    if (!currentUser || !shopifyEnabled) return false
    
    // Admin and lister can publish comics
    return ['admin', 'lister'].includes(currentUser.role)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading comics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Comics Collection Heading */}
        <div className="mb-8 text-center">
          <h2 className="comic-title text-4xl text-gray-900 mb-2">Shared Comics Collection</h2>
          <p className="comic-body text-gray-600 text-lg">
            {searchParams.search ? (
              <>
                Found {comics?.length || 0} comics matching "{searchParams.search}"
              </>
            ) : (
              <>
                {comics?.length || 0} comics in the shared collection
              </>
            )}
          </p>
        </div>

        {comics && comics.length > 0 ? (
          <div className="comic-grid">
            {comics.map((comic) => (
              <div key={comic.id} className="relative group">
                <Link href={`/comics/${comic.id}`}>
                  <Card className="comic-card bg-white border-0 shadow-lg overflow-hidden cursor-pointer page-turn">
                    <CardContent className="p-0">
                      {/* Comic Cover Image */}
                      <div className="comic-cover aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                        <ComicImage 
                          src={comic.image_url} 
                          alt={`${comic.title} cover`}
                          title={comic.title}
                          className="w-full h-full"
                        />

                        {/* Comic panel overlay */}
                        <div className="absolute top-3 left-3">
                          <Badge className="comic-badge bg-gradient-to-r from-yellow-400 to-red-500 text-white border-2 border-white shadow-lg">
                            📚
                          </Badge>
                        </div>

                        {/* Comic panel border overlay */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-400 transition-colors duration-300"></div>
                      </div>

                      {/* Comic Details */}
                      <div className="p-4 space-y-3 bg-gradient-to-br from-white to-gray-50">
                        {/* Title */}
                        <div>
                          <h3 className="comic-heading text-sm line-clamp-2 text-gray-900 mb-1">
                            {comic.title}
                          </h3>
                          <p className="comic-body text-xs text-gray-600">Comic Book</p>
                        </div>

                        {/* Comic badges */}
                        <div className="flex flex-wrap gap-1">
                          <Badge className="comic-badge bg-gradient-to-r from-indigo-400 to-indigo-500 text-white border-2 border-indigo-600">
                            Comic
                          </Badge>
                          {comic.condition && (
                            <Badge className={`comic-badge ${getConditionColor(comic.condition)}`}>
                              {comic.condition}
                            </Badge>
                          )}
                          {comic.for_sale && (
                            <Badge className="comic-badge bg-gradient-to-r from-green-400 to-green-500 text-white border-2 border-green-600">
                              For Sale
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Action buttons positioned outside the Link */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  {canPublishComic(comic) && (
                    <div className="pointer-events-auto">
                      <Button 
                        size="sm" 
                        className="comic-button bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-2 border-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handlePublishClick(comic.id, comic.title)
                        }}
                        title="Publish to Shopify"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {canEditComic(comic) && (
                    <div className="pointer-events-auto">
                      <Button 
                        size="sm" 
                        className="comic-button bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" 
                        asChild
                      >
                        <Link href={`/comics/${comic.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                  {canDeleteComic(comic) && (
                    <div className="pointer-events-auto">
                      <Button 
                        size="sm" 
                        className="comic-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteClick(comic.id, comic.title)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-40 h-40 comic-panel bg-gradient-to-br from-yellow-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-8 transform hover:scale-105 transition-transform duration-300">
              <span className="text-8xl">📚</span>
            </div>
            <h3 className="comic-title text-3xl text-gray-900 mb-4">
              {error ? "Database Error" : "Start Your Collection"}
            </h3>
            <p className="comic-body text-gray-600 mb-8 max-w-md mx-auto text-lg">
              {error ? (
                <>
                  There was an error loading comics: {error.message}
                  <br />
                  <br />
                  Please check your database setup and run the SQL scripts.
                </>
              ) : searchParams.search || searchParams.condition || searchParams.for_sale ? (
                "No comics match your current filters. Try adjusting your search criteria."
              ) : (
                "Build your comic collection by adding your first comic. Track conditions, grades, and values with professional tools."
              )}
            </p>
            {!error && (
              <RoleGuard allowedRoles={['admin', 'lister']}>
                <Button asChild size="lg" className="comic-button bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-white border-2 border-yellow-600 shadow-lg">
                  <Link href="/comics/add">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Comic
                  </Link>
                </Button>
              </RoleGuard>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Comic"
        message={`Are you sure you want to delete "${deleteDialog.comicTitle}"? This action cannot be undone and will permanently remove the comic from your collection.`}
        confirmText="Delete Comic"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />

      {/* Store Selection Dialog */}
      {storeSelectionDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-gray-300 shadow-2xl max-w-md w-full rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Select Shopify Store</h3>
                <button
                  onClick={handleStoreSelectionCancel}
                  disabled={storeSelectionDialog.loading}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-700 mb-4">
                Choose which store to publish "{storeSelectionDialog.comicTitle}" to:
              </p>

              {storeSelectionDialog.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading stores...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {storeSelectionDialog.stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => handlePublishConfirm(store.id)}
                      disabled={storeSelectionDialog.loading}
                      className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{store.store_name}</div>
                      <div className="text-sm text-gray-600">{store.shopify_shop}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleStoreSelectionCancel}
                  disabled={storeSelectionDialog.loading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
