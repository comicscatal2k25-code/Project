"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function DebugInfo() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [comicsCount, setComicsCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getDebugInfo() {
      const supabase = createClient()
      
      // Get user role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(profile?.role || 'unknown')
      }

      // Get comics count
      const { count } = await supabase
        .from('comics')
        .select('*', { count: 'exact', head: true })
      
      setComicsCount(count || 0)
      setLoading(false)
    }

    getDebugInfo()
  }, [])

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Loading debug info...</div>
  }

  return (
    <div className="p-4 bg-blue-100 text-blue-800 text-sm">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <p>User Role: <strong>{userRole}</strong></p>
      <p>Comics Count: <strong>{comicsCount}</strong></p>
      <p>Can Edit: <strong>{userRole === 'admin' || userRole === 'lister' ? 'YES' : 'NO'}</strong></p>
      <p>Can Delete: <strong>{userRole === 'admin' ? 'YES' : 'NO'}</strong></p>
    </div>
  )
}
