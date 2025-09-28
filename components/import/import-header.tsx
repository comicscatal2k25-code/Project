import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ImportHeader() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Import Comics
        </h1>
        <p className="text-muted-foreground mt-2">Bulk import your comic collection from CSV files</p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/export">Export Data</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/import/template.csv" download>
            Download Template
          </Link>
        </Button>
      </div>
    </div>
  )
}
