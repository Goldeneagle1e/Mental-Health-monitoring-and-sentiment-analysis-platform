"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import type { UserProfile } from "@/lib/user-profile"
import { deleteAnalysisRecord } from "@/lib/client/data-client"

interface AnalysisRecord {
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

interface AnalysisHistoryProps {
  user: UserProfile
  onUserUpdate?: (profile: UserProfile) => void
  onBack: () => void
}

export default function AnalysisHistory({ user, onUserUpdate, onBack }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null)

  useEffect(() => {
    setAnalyses(user.analyses || [])
  }, [user.analyses])

  const handleDelete = async (id: string) => {
    const response = await deleteAnalysisRecord(id)
    setAnalyses(response.analyses)
    onUserUpdate?.({
      ...user,
      analyses: response.analyses,
    })
    if (selectedAnalysis?.id === id) {
      setSelectedAnalysis(null)
    }
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

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "moderate":
        return <AlertCircle className="w-4 h-4" />
      case "low":
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (selectedAnalysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analysis Details</h2>
          <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
            Back to History
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results from {new Date(selectedAnalysis.timestamp).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-lg border-2`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={getRiskColor(selectedAnalysis.results.overall_risk)}>
                  {getRiskIcon(selectedAnalysis.results.overall_risk)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Risk Level</p>
                  <p className={`text-2xl font-bold capitalize ${getRiskColor(selectedAnalysis.results.overall_risk)}`}>
                    {selectedAnalysis.results.overall_risk}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Anxiety</p>
                  <p className="text-3xl font-bold">{selectedAnalysis.results.anxiety.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Depression</p>
                  <p className="text-3xl font-bold">{selectedAnalysis.results.depression.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Stress</p>
                  <p className="text-3xl font-bold">{selectedAnalysis.results.stress.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Indicators</h3>
              <div className="space-y-2">
                {selectedAnalysis.results.indicators.map((ind, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    • {ind}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analysis History</h2>
          <p className="text-sm text-muted-foreground">View all your previous analyses</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.surveyHistory.length === 0 && (
            <Alert>
              <AlertDescription>No survey history yet. Complete the onboarding survey to establish a baseline.</AlertDescription>
            </Alert>
          )}

          {user.surveyHistory.map((survey) => (
            <div key={survey.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium capitalize">{survey.overallRisk} baseline</p>
                <p className="text-sm text-muted-foreground">{new Date(survey.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-sm text-muted-foreground">{survey.summary}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-md bg-muted p-3">Stress: {survey.stressScore}</div>
                <div className="rounded-md bg-muted p-3">Anxiety: {survey.anxietyScore}</div>
                <div className="rounded-md bg-muted p-3">Depression: {survey.depressionScore}</div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Answers: {survey.answers.join(", ")}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {analyses.length === 0 ? (
        <Alert>
          <AlertDescription>No analyses yet. Start by creating a new analysis.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedAnalysis(analysis)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={getRiskColor(analysis.results.overall_risk)}>
                        {getRiskIcon(analysis.results.overall_risk)}
                      </div>
                      <span className={`font-semibold capitalize ${getRiskColor(analysis.results.overall_risk)}`}>
                        {analysis.results.overall_risk} Risk
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(analysis.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{analysis.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDelete(analysis.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
