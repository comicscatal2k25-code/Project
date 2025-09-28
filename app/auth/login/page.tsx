"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Zap, BookOpen, ShoppingCart, Star, Shield, Users, BarChart3, Book } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/comics"
  
  useEffect(() => {
    console.log('Redirect target:', redirectTo)
  }, [redirectTo])

  const handleLogin = async () => {
    console.log('Login initiated!')
    console.log('Username:', username)
    console.log('Password length:', password.length)
    setIsLoading(true)
    setError(null)

    try {
      console.log('Attempting login with:', { username, password: '***' })
      
      // Hash the password (in production, use a proper hashing library)
      const passwordHash = btoa(password) // Simple base64 encoding for demo
      console.log('Password hash:', passwordHash)
      
      console.log('Making API call to /api/auth/login')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password_hash: passwordHash,
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        console.log('Login failed:', data.error)
        throw new Error(data.error || 'Login failed')
      }

      console.log('Login successful!')
      // Session is automatically set as httpOnly cookie by the server
      // No need to store in localStorage - the server handles it
      console.log('Session cookie set by server, redirecting to:', redirectTo)
      
      // Test the session API immediately
      console.log('Testing session API...')
      try {
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        console.log('Session API response status:', sessionResponse.status)
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          console.log('Session API data:', sessionData)
        } else {
          console.log('Session API failed:', await sessionResponse.text())
        }
      } catch (sessionError) {
        console.error('Session API error:', sessionError)
      }
      
      // Force redirect to /comics if redirectTo is empty
      const targetPath = redirectTo || '/comics'
      console.log('Final redirect target:', targetPath)
      
      console.log('About to redirect to:', targetPath)
      // Add a small delay to ensure the session cookie is set
      setTimeout(() => {
        console.log('Redirecting now to:', targetPath)
        window.location.href = targetPath
      }, 100)
    } catch (error: unknown) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Comic book page background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      {/* Comic book panels floating around */}
      <div className="absolute top-20 left-10 w-32 h-40 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-lg transform rotate-12 animate-pulse border-2 border-yellow-300/20 shadow-lg">
        <div className="p-2 text-yellow-200 text-xs font-bold">COMIC</div>
      </div>
      <div className="absolute bottom-20 right-10 w-28 h-36 bg-gradient-to-br from-red-400/30 to-pink-500/30 rounded-lg transform -rotate-12 animate-pulse delay-1000 border-2 border-red-300/20 shadow-lg">
        <div className="p-2 text-red-200 text-xs font-bold">HERO</div>
      </div>
      <div className="absolute top-1/2 left-1/4 w-20 h-24 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-lg transform rotate-45 animate-pulse delay-500 border-2 border-blue-300/20 shadow-lg">
        <div className="p-1 text-blue-200 text-xs font-bold">CATALOG</div>
      </div>
      <div className="absolute top-1/3 right-1/4 w-24 h-32 bg-gradient-to-br from-green-400/30 to-teal-500/30 rounded-lg transform -rotate-12 animate-pulse delay-700 border-2 border-green-300/20 shadow-lg">
        <div className="p-2 text-green-200 text-xs font-bold">MANAGER</div>
      </div>
      
      {/* Comic book speech bubbles */}
      <div className="absolute top-32 right-20 w-16 h-12 bg-white/20 rounded-full transform rotate-12 animate-bounce delay-300">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/20"></div>
      </div>
      <div className="absolute bottom-32 left-20 w-20 h-14 bg-white/20 rounded-full transform -rotate-12 animate-bounce delay-1000">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white/20"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
          {/* Main login card with comic book styling */}
          <Card className="border-4 border-yellow-400/30 shadow-2xl bg-gradient-to-br from-white via-yellow-50/50 to-orange-50/50 backdrop-blur-sm relative overflow-hidden">
            {/* Comic book corner decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-400/20 to-transparent transform rotate-45 translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-400/20 to-transparent transform rotate-45 -translate-x-8 translate-y-8"></div>
            
            <CardHeader className="text-center space-y-4 pb-8 relative z-10">
              {/* Comic book style logo */}
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform hover:scale-105 transition-transform border-4 border-yellow-300 relative">
                <Book className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-800" />
                </div>
            </div>
              
              <div className="space-y-2">
                <CardTitle className="text-4xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent tracking-wide">
                  POW! 💥
                </CardTitle>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Comic Catalog Manager
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 font-medium">
                  Enter the world of comic collection management!
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              <form onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    Hero Username
                </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="superhero"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 border-2 border-yellow-300 focus:border-red-500 transition-colors bg-yellow-50/50 font-medium"
                  />
              </div>
                
              <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Secret Password
                </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-2 border-yellow-300 focus:border-red-500 transition-colors pr-12 bg-yellow-50/50 font-medium"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-yellow-200/50"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-600" /> : <Eye className="h-4 w-4 text-slate-600" />}
                    </Button>
              </div>
                </div>
                
                {error && (
                  <div className="p-4 text-sm text-red-800 bg-red-100 border-2 border-red-300 rounded-lg font-medium">
                    ⚠️ {error}
                </div>
              )}
                
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white font-black text-lg shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-yellow-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Entering Comic Universe...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>ENTER COMIC UNIVERSE! 🚀</span>
                    </div>
                  )}
                </Button>
              </form>
              
              {/* Admin-only access message */}
              <div className="text-center text-sm text-slate-600 font-medium bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Shield className="w-4 h-4 inline mr-1 text-blue-500" />
                Admin-only access. Contact your administrator for an account.
            </div>
          </CardContent>
        </Card>

          {/* Comic-themed feature highlights */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="text-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-yellow-300/20">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-lg flex items-center justify-center mx-auto mb-2 border border-yellow-300/30">
                <BookOpen className="h-6 w-6 text-yellow-200" />
              </div>
              <p className="text-sm font-bold text-yellow-100">Comic Catalog</p>
              <p className="text-xs text-yellow-200/80">Manage your collection</p>
            </div>
            <div className="text-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-red-300/20">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400/30 to-pink-500/30 rounded-lg flex items-center justify-center mx-auto mb-2 border border-red-300/30">
                <ShoppingCart className="h-6 w-6 text-red-200" />
              </div>
              <p className="text-sm font-bold text-red-100">Shopify Store</p>
              <p className="text-xs text-red-200/80">Sell your comics</p>
            </div>
            <div className="text-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-blue-300/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-lg flex items-center justify-center mx-auto mb-2 border border-blue-300/30">
                <BarChart3 className="h-6 w-6 text-blue-200" />
              </div>
              <p className="text-sm font-bold text-blue-100">Analytics</p>
              <p className="text-xs text-blue-200/80">Track your sales</p>
            </div>
            <div className="text-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-green-300/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400/30 to-teal-500/30 rounded-lg flex items-center justify-center mx-auto mb-2 border border-green-300/30">
                <Users className="h-6 w-6 text-green-200" />
              </div>
              <p className="text-sm font-bold text-green-100">Team Access</p>
              <p className="text-xs text-green-200/80">Role-based control</p>
            </div>
          </div>
          
          {/* Comic book style footer */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm font-medium">
              🦸‍♂️ Powered by Comic Heroes & Super Technology 🦸‍♀️
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
