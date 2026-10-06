"use client"

// --- IMPORTS ---
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import CrisisSupportPanel from "@/components/support/crisis-support-panel"

// --- INTERFACE ---
interface AnalysisResultsProps {
  result: {
    id: string
    content: string
    type: string
    timestamp: string
    results: {
      anxiety: number
      depression: number
      stress: number
      overall_risk: "low" | "moderate" | "high"
      indicators: string[]
      recommendations: string[]
    }
  }
  onNewAnalysis: () => void
  title: string;
  description: string;
  riskColorClass: string;
}

// --- COMPONENT FUNCTION ---
export default function AnalysisResults({ 
    result, 
    onNewAnalysis, 
    title, 
    description,
    riskColorClass 
}: AnalysisResultsProps) {
    
  // --- Early Return Check (Safeguard) ---
  if (!result || !result.results) {
      return (
          <Card className="shadow-lg p-6 text-center text-gray-500 w-full">
              <CardContent className="flex flex-col items-center justify-center p-4">
                  <AlertCircle className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="font-semibold">Loading analysis results...</p>
                  <p className="text-sm">Awaiting data from the analysis service.</p>
              </CardContent>
          </Card>
      );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-destructive"
      case "moderate":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-foreground"
    }
  }

  const getRiskBorderClass = (risk: string) => {
    switch (risk) {
      case "high":
        return "border-destructive"
      case "moderate":
        return "border-yellow-600"
      case "low":
        return "border-green-600"
      default:
        return "border-border"
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="w-6 h-6" />
      case "moderate":
        return <AlertCircle className="w-6 h-6" />
      case "low":
        return <CheckCircle className="w-6 h-6" />
      default:
        return null
    }
  }

  return (
    // Reverted to smaller spacing: space-y-6 for the main container
    <div className="space-y-6">
      <Card className="shadow-lg">
        {/* Adopted clean header styling */}
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title || "Analysis Results"}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{description || `Generated on ${new Date(result.timestamp).toLocaleString()}`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Overall Risk Assessment - Reverted to simpler, theme-based styling */}
          <div 
            className={`p-4 rounded-lg border-2 ${getRiskBorderClass(result.results.overall_risk)}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={getRiskColor(result.results.overall_risk)}>
                {getRiskIcon(result.results.overall_risk)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Risk Level</p>
                <p className={`text-2xl font-bold capitalize ${getRiskColor(result.results.overall_risk)}`}>
                  {result.results.overall_risk}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Metrics - Adopted the simpler, clean bg-muted cards with horizontal bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* ANXIETY */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Anxiety Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{result.results.anxiety.toFixed(1)}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="mt-3 w-full bg-background rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${result.results.anxiety}%` }}></div>
                </div>
              </CardContent>
            </Card>

            {/* DEPRESSION */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Depression Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{result.results.depression.toFixed(1)}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="mt-3 w-full bg-background rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${result.results.depression}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* STRESS */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Stress Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{result.results.stress.toFixed(1)}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="mt-3 w-full bg-background rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${result.results.stress}%` }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detected Indicators - Adopted clean styling and spacing */}
          <div>
            <h3 className="font-semibold mb-3">Detected Indicators</h3>
            <div className="space-y-2">
              {result.results.indicators.map((indicator, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                  <p className="text-sm">{indicator}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations - Adopted clean styling and spacing */}
          <div>
            <h3 className="font-semibold mb-3">Recommendations</h3>
            <div className="space-y-2">
              {result.results.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {result.results.overall_risk === "high" && (
            <CrisisSupportPanel risk="high" headline="This analysis crossed the high-risk threshold" />
          )}
        </CardContent>
      </Card>

      {/* Buttons - Adopted smaller gap and transparent outline button style */}
      <div className="flex gap-3">
        <Button onClick={onNewAnalysis} className="flex-1">
          New Analysis
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent">
          Download Report
        </Button>
      </div>
    </div>
  )
}
