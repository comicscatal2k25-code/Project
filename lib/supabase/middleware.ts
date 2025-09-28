import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { validateSessionToken } from "@/lib/session-utils"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables")
    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Check for custom session token instead of Supabase auth
  const sessionToken = request.cookies.get('session_token')?.value
  let user = null
  
  if (sessionToken) {
    const validation = validateSessionToken(sessionToken)
    if (validation.valid && validation.user) {
      user = {
        id: validation.user.id,
        username: validation.user.username,
        role: validation.user.role
      }
    } else {
      console.log('Session validation failed in middleware:', validation.error)
      user = null
    }
  }

  // Define public routes that don't require authentication
  // RBAC: When RBAC is enabled, sign-up is disabled
  const rbacEnabled = process.env.FEATURE_RBAC === 'true'
  const publicRoutes = rbacEnabled 
    ? ["/auth/login", "/auth/error"]
    : ["/auth/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error"]
  
  // Define routes that require authentication (including root path)
  const protectedRoutes = ["/", "/comics", "/dashboard", "/admin", "/import", "/export", "/jobs", "/shopify", "/reports"]

  const currentPath = request.nextUrl.pathname

  // If user is not authenticated and trying to access protected routes
  if (!user && protectedRoutes.includes(currentPath)) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth pages, redirect to comics
  // RBAC: Allow access to sign-up page when RBAC is disabled
  if (user && publicRoutes.includes(currentPath)) {
    const url = request.nextUrl.clone()
    url.pathname = "/comics"
    return NextResponse.redirect(url)
  }

  // RBAC: Block access to sign-up routes when RBAC is enabled
  if (rbacEnabled && (currentPath === "/auth/sign-up" || currentPath === "/auth/sign-up-success")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}