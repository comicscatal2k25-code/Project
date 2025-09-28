"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function JobsHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Trigger a page refresh to update job statuses
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Background Jobs
        </h1>
        <p className="text-muted-foreground mt-2">Monitor and manage background processing tasks</p>
      </div>
      <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  )
}
