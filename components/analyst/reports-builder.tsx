"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  Image, 
  Copy, 
  Star, 
  DollarSign,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  color: string
}

export function ReportsBuilder() {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [customReportName, setCustomReportName] = useState('')
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv')
  const [minPrice, setMinPrice] = useState('100')
  const [isGenerating, setIsGenerating] = useState(false)

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'missing-required-fields',
      name: 'Missing Required Fields',
      description: 'Items missing title, price, or image',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      id: 'missing-images',
      name: 'Missing Images',
      description: 'Items without cover images',
      icon: Image,
      color: 'text-orange-600'
    },
    {
      id: 'potential-duplicates',
      name: 'Potential Duplicates',
      description: 'Items that may be duplicates based on title and series',
      icon: Copy,
      color: 'text-yellow-600'
    },
    {
      id: 'recent-publish-failures',
      name: 'Recent Publish Failures',
      description: 'Items that failed to publish in the last 7 days',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      id: 'key-issues',
      name: 'Key Issues',
      description: 'All items marked as key issues',
      icon: Star,
      color: 'text-purple-600'
    },
    {
      id: 'high-value-items',
      name: 'High Value Items',
      description: 'Items above a specified price threshold',
      icon: DollarSign,
      color: 'text-green-600'
    }
  ]

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const generateReport = async () => {
    if (selectedTemplates.length === 0) {
      toast.error('Please select at least one report template')
      return
    }

    setIsGenerating(true)
    try {
      // Generate reports for each selected template
      const reportPromises = selectedTemplates.map(async (templateId) => {
        const response = await fetch('/api/analytics/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            template: templateId,
            format: exportFormat,
            reportName: customReportName || undefined,
            filters: templateId === 'high-value-items' ? { minPrice: parseInt(minPrice) } : undefined
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate report')
        }

        return response.json()
      })

      const results = await Promise.all(reportPromises)
      
      // Show success message and provide download links
      results.forEach((result, index) => {
        const template = reportTemplates.find(t => t.id === selectedTemplates[index])
        toast.success(`${template?.name} report generated successfully!`, {
          action: {
            label: 'Download',
            onClick: () => window.open(result.downloadUrl, '_blank')
          }
        })
      })

      // Reset form
      setSelectedTemplates([])
      setCustomReportName('')
      
    } catch (error) {
      console.error('Report generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate reports')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports Builder</h2>
        <p className="text-gray-600">Generate custom reports and export data in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Report Templates</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Select one or more templates to generate reports</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportTemplates.map((template) => {
              const Icon = template.icon
              const isSelected = selectedTemplates.includes(template.id)
              
              return (
                <div 
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => handleTemplateToggle(template.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className={`w-4 h-4 ${template.color}`} />
                        <h3 className="font-medium">{template.name}</h3>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Report Configuration</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Configure your report settings</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Custom Report Name */}
            <div className="space-y-2">
              <Label htmlFor="reportName">Custom Report Name (Optional)</Label>
              <Input
                id="reportName"
                placeholder="Enter custom report name"
                value={customReportName}
                onChange={(e) => setCustomReportName(e.target.value)}
              />
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: 'csv' | 'xlsx') => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* High Value Items Configuration */}
            {selectedTemplates.includes('high-value-items') && (
              <div className="space-y-2">
                <Label htmlFor="minPrice">Minimum Price for High Value Items</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="100"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
            )}

            {/* Selected Templates Summary */}
            {selectedTemplates.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Reports ({selectedTemplates.length})</Label>
                <div className="space-y-1">
                  {selectedTemplates.map(templateId => {
                    const template = reportTemplates.find(t => t.id === templateId)
                    return (
                      <div key={templateId} className="text-sm text-gray-600 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{template?.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={generateReport}
              disabled={selectedTemplates.length === 0 || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Reports...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Reports
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
