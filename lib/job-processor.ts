export class JobProcessor {
  private isProcessing = false
  private intervalId: NodeJS.Timeout | null = null

  start() {
    if (this.isProcessing) return

    this.isProcessing = true
    console.log("Job processor started")

    // Process jobs every 30 seconds
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/jobs/process", {
          method: "POST",
        })

        if (response.ok) {
          const result = await response.json()
          if (result.jobId) {
            console.log(`Processed job ${result.jobId}: ${result.status}`)
          }
        }
      } catch (error) {
        console.error("Job processing error:", error)
      }
    }, 30000)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isProcessing = false
    console.log("Job processor stopped")
  }
}

// Global job processor instance
export const jobProcessor = new JobProcessor()
