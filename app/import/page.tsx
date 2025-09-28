import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ImportHeader } from "@/components/import/import-header"
import { ImportUpload } from "@/components/import/import-upload"
import { ImportHistory } from "@/components/import/import-history"
import { ImportTemplate } from "@/components/import/import-template"

export default async function ImportPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <ImportHeader />

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ImportUpload userId={data.user.id} />
            <ImportHistory userId={data.user.id} />
          </div>
          <div>
            <ImportTemplate />
          </div>
        </div>
      </div>
    </div>
  )
}
