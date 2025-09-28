import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExportHeader } from "@/components/export/export-header"
import { ExportOptions } from "@/components/export/export-options"
import { ExportHistory } from "@/components/export/export-history"

export default async function ExportPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <ExportHeader />

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ExportOptions userId={data.user.id} />
          </div>
          <div>
            <ExportHistory userId={data.user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
