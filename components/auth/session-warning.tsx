"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"

interface SessionWarningProps {
  onExtendSession?: () => void
  onLogout?: () => void
}

export function SessionWarning({ onExtendSession, onLogout }: SessionWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const checkSessionExpiry = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const user = await response.json()
          // For now, we'll show a warning 5 minutes before expiry
          // In a real app, you'd get the actual expiry time from the session
          setTimeRemaining(5 * 60) // 5 minutes in seconds
          setShowWarning(true)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    // Check session every minute
    const interval = setInterval(checkSessionExpiry, 60000)
    
    // Initial check
    checkSessionExpiry()

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowWarning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!showWarning || timeRemaining <= 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50">
        <Clock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Expiring Soon</p>
              <p className="text-sm">Your session will expire in {formatTime(timeRemaining)}</p>
            </div>
            <div className="flex gap-2 ml-4">
              {onExtendSession && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExtendSession}
                  className="text-orange-800 border-orange-300 hover:bg-orange-100"
                >
                  Extend
                </Button>
              )}
              {onLogout && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLogout}
                  className="text-orange-800 border-orange-300 hover:bg-orange-100"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
