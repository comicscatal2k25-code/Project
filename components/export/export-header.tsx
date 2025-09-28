import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ExportHeader() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Export Comics
        </h1>
        <p className="text-muted-foreground mt-2">Export your comic collection data in various formats</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/import">Import Data</Link>
      </Button>
    </div>
  )
}
