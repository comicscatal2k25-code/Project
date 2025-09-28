import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { comic_ids, action } = await request.json()

    // Get Shopify settings
    const { data: shopifySettings, error: settingsError } = await supabase
      .from("shopify_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (settingsError || !shopifySettings) {
      return NextResponse.json({ error: "Shopify not connected" }, { status: 400 })
    }

    // Get comics to sync
    const { data: comics, error: comicsError } = await supabase
      .from("comics")
      .select("*")
      .eq("user_id", user.id)
      .in("id", comic_ids)

    if (comicsError || !comics) {
      return NextResponse.json({ error: "Comics not found" }, { status: 404 })
    }

    // Create sync jobs for each comic
    const jobs = comics.map((comic) => ({
      user_id: user.id,
      job_type: "shopify_sync" as const,
      payload: {
        action,
        comic_id: comic.id,
        shopify_settings: shopifySettings,
      },
      priority: 1,
    }))

    const { error: jobError } = await supabase.from("job_queue").insert(jobs)

    if (jobError) {
      return NextResponse.json({ error: "Failed to create sync jobs" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${jobs.length} sync jobs created`,
    })
  } catch (error) {
    console.error("Shopify sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
