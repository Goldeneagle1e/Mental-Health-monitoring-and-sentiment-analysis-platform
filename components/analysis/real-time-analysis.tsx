"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"

// Import the necessary analysis functions and interfaces from your client library
import { 
  fetchSocialMediaContent, 
  analyzeText, 
  AnalysisResult 
} from "@/lib/api-client" 
import type { UserProfile } from "@/lib/user-profile"
import CrisisSupportPanel from "@/components/support/crisis-support-panel"
import { saveAnalysisRecord } from "@/lib/client/data-client"

// Define the structure of an aggregated analysis result item
interface PostAnalysis {
  id: string;
  content: string;
  timestamp: string;
  analysis: AnalysisResult; // The result from your ML server
}

interface RealTimeAnalysisProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
}

export default function RealTimeAnalysis({ user, onUserUpdate }: RealTimeAnalysisProps) {
  const [url, setUrl] = useState("")
  const [platform, setPlatform] = useState("twitter")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  // New state to hold the results of all analyzed posts
  const [postAnalyses, setPostAnalyses] = useState<PostAnalysis[] | null>(null)

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPostAnalyses(null) // Clear previous results

    const connection = user.socialConnections[platform as keyof typeof user.socialConnections]

    if (connection?.status !== "connected") {
      setError("Connect your account for this platform before importing posts.")
      return
    }

    setIsLoading(true)

    try {
      // 1. Fetch content from the social media proxy route
      const fetchResponse = await fetchSocialMediaContent({
        url: url.trim() || undefined,
        platform,
        username: connection.username,
      })
      
      const postsToAnalyze = fetchResponse.posts || []
      
      if (postsToAnalyze.length === 0) {
        setError("Could not fetch any posts for analysis.")
        setIsLoading(false)
        return
      }

      // 2. Analyze each fetched post concurrently
      const analysisPromises = postsToAnalyze.map((post: any) => 
        analyzeText(post.content, platform) // Send text to FastAPI via /api/analyze/text proxy
          .then((analysisResult: AnalysisResult) => ({
            id: post.id,
            content: post.content,
            timestamp: post.timestamp,
            analysis: analysisResult,
          }))
          .catch((err) => {
            console.error("Analysis failed for a post:", err);
            // Return a placeholder for failed analysis
            return {
              id: post.id,
              content: post.content,
              timestamp: post.timestamp,
              analysis: { 
                anxiety: 0, depression: 0, stress: 0, overall_risk: "low", 
                indicators: ["Analysis Failed"], recommendations: ["Check ML server logs"] 
              } as AnalysisResult,
            } as PostAnalysis;
          })
      )

      // Wait for all analysis calls to complete
      const allResults: PostAnalysis[] = await Promise.all(analysisPromises);
      
      setPostAnalyses(allResults);
      const savedResults = await Promise.all(
        allResults.map((item) =>
          saveAnalysisRecord({
            id: item.id,
            content: item.content,
            type: `${platform}-import`,
            timestamp: item.timestamp,
            results: item.analysis,
          }),
        ),
      )
      const latestPayload = savedResults[savedResults.length - 1]
      if (latestPayload?.analyses) {
        onUserUpdate({
          ...user,
          analyses: latestPayload.analyses,
        })
      }

    } catch (err: any) {
      console.error("Real-Time Fetch Error:", err);
      // Display the most relevant error message from the failed proxy call
      setError(err.message || "Failed to fetch content. Ensure the ML server is running.");
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get the color for the overall risk level
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "border-destructive text-destructive"
      case "moderate":
        return "border-yellow-600 text-yellow-600"
      case "low":
      default:
        return "border-green-600 text-green-600"
    }
  }

  return (
    <form onSubmit={handleFetch} className="space-y-4">
      
      {/* Input Form */}
      <Card className="p-4 space-y-4">
        <Alert>
          <AlertDescription>
            Import is enabled only for accounts you have connected and consented to analyze. If platform credentials are not configured on the server, demo data will be used after connection.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="twitter">Twitter/X</option>
            <option value="reddit">Reddit</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Post/Profile URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="Optional: specific post or profile URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Fetching & Analyzing..." : "Fetch & Analyze"}
        </Button>
      </Card>
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {postAnalyses && postAnalyses.length > 0 && (
        <div className="space-y-4">
          {postAnalyses.some((item) => item.analysis.overall_risk === "high") && (
            <CrisisSupportPanel risk="high" headline="One or more imported posts were flagged as high risk" />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Analysis of {postAnalyses.length} Posts</CardTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                Results aggregated from the fetched social media content.
              </AlertDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {postAnalyses.map((item, index) => (
                <div key={item.id} className={`p-3 border-l-4 rounded-md ${getRiskColor(item.analysis.overall_risk)} bg-muted/50`}>
                  <p className="text-xs text-muted-foreground">Post {index + 1} ({new Date(item.timestamp).toLocaleDateString()})</p>
                  <p className="text-sm mb-2 italic">"{item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}"</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Risk:</span>
                    <span className={`font-bold capitalize ${getRiskColor(item.analysis.overall_risk)}`}>
                      {item.analysis.overall_risk}
                    </span>
                    
                    <span className="ml-4 text-xs text-muted-foreground">
                      Anxiety: {item.analysis.anxiety.toFixed(0)} | 
                      Depression: {item.analysis.depression.toFixed(0)} | 
                      Stress: {item.analysis.stress.toFixed(0)}
                    </span>
                  </div>
                  
                  {item.analysis.overall_risk === "high" && (
                      <AlertTriangle className="h-4 w-4 text-destructive inline ml-2" />
                  )}
                </div>
              ))}
              
              <Alert variant="default" className="mt-4">
                <AlertDescription className="text-sm">
                  Imported posts are only analyzed after explicit profile consent. Server-side live fetch can be enabled per platform as API credentials become available.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}
      
    </form>
  )
}
