import { createClient } from "@/lib/supabase/server"

interface ComicsStatsProps {
  userId: string
}

export async function ComicsStats({ userId }: ComicsStatsProps) {
  const supabase = await createClient()

  try {
    // Get total comics count - ALL comics in shared catalog
    const { count: totalComics } = await supabase
      .from("comics")
      .select("*", { count: "exact", head: true })

    // Get key issues count (if the column exists) - ALL comics in shared catalog
    let keyIssues = 0
    try {
      const { count } = await supabase
        .from("comics")
        .select("*", { count: "exact", head: true })
        .eq("is_key_issue", true)
      keyIssues = count || 0
    } catch (error) {
      // Column doesn't exist yet
      keyIssues = 0
    }

    // Get total value (sum of current_value if it exists) - ALL comics in shared catalog
    let totalValue = 0
    try {
      const { data: valueData } = await supabase
        .from("comics")
        .select("current_value")
        .not("current_value", "is", null)

      totalValue = valueData?.reduce((sum, comic) => {
        return sum + (comic.current_value || 0)
      }, 0) || 0
    } catch (error) {
      // Column doesn't exist yet
      totalValue = 0
    }

    // Get for sale count - ALL comics in shared catalog
    let forSaleCount = 0
    try {
      const { count } = await supabase
        .from("comics")
        .select("*", { count: "exact", head: true })
        .eq("for_sale", true)
      forSaleCount = count || 0
    } catch (error) {
      // Column doesn't exist yet
      forSaleCount = 0
    }

  return (
    <div className="comic-panel bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white relative overflow-hidden">
      {/* Comic panel background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-2 w-4 h-4 border border-white rounded-sm"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border border-white rounded-sm"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border border-white rounded-sm"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border border-white rounded-sm"></div>
      </div>
      
      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Quick Stats Heading */}
        <div className="mb-6">
          <h3 className="comic-title text-2xl mb-2">Quick Stats</h3>
          <p className="comic-body text-white/80 text-sm">Overview of the shared comic collection</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="comic-stat bg-gradient-to-br from-yellow-400/20 to-red-500/20 backdrop-blur-sm border-2 border-white/30">
            <div className="comic-title text-3xl">{totalComics || 0}</div>
            <div className="comic-body text-sm text-white/90">Total Comics</div>
          </div>
          <div className="comic-stat bg-gradient-to-br from-teal-400/20 to-blue-500/20 backdrop-blur-sm border-2 border-white/30">
            <div className="comic-title text-3xl">{keyIssues}</div>
            <div className="comic-body text-sm text-white/90">Key Issues</div>
          </div>
          <div className="comic-stat bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-sm border-2 border-white/30">
            <div className="comic-title text-3xl">
              {totalValue > 0 ? `$${totalValue.toLocaleString()}` : "N/A"}
            </div>
            <div className="comic-body text-sm text-white/90">Total Value</div>
          </div>
          <div className="comic-stat bg-gradient-to-br from-green-400/20 to-emerald-500/20 backdrop-blur-sm border-2 border-white/30">
            <div className="comic-title text-3xl">{forSaleCount}</div>
            <div className="comic-body text-sm text-white/90">For Sale</div>
          </div>
        </div>
      </div>
    </div>
    )
  } catch (error) {
    console.error("Error fetching comics stats:", error)
    // Fallback to basic stats
    return (
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white">
        <div className="container mx-auto px-6 py-6">
          {/* Quick Stats Heading */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Quick Stats</h3>
            <p className="text-white/80 text-sm">Overview of the shared comic collection</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-white/80">Total Comics</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-white/80">Key Issues</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">N/A</div>
              <div className="text-sm text-white/80">Total Value</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-white/80">For Sale</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
