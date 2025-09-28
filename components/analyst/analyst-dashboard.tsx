"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  FileText, 
  Download, 
  TrendingUp, 
  AlertTriangle,
  Image,
  Copy,
  Star,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react'
import { InsightsSummary } from './insights-summary'
import { ChartsSection } from './charts-section'
import { ReportsBuilder } from './reports-builder'
import { RecentReports } from './recent-reports'

export function AnalystDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analyst Dashboard</h1>
              <p className="text-white/80 text-sm">Insights & Reports for Comic Collection</p>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-400 to-red-500 text-white border-2 border-white shadow-lg">
              <BarChart3 className="w-3 h-3 mr-1" />
              ANALYST
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <InsightsSummary />
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <ChartsSection />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsBuilder />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <RecentReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
