"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AnalysisResults from "./analysis-results"
import ImageUpload from "./image-upload"
import { analyzeText, analyzeCombined } from "@/lib/api-client"
import { uploadImages, isGifFile } from "@/lib/image-utils"
import type { UserProfile } from "@/lib/user-profile"
import { saveAnalysisRecord } from "@/lib/client/data-client"

// Helper function to perform combined analysis (text + images)
async function performCombinedAnalysis({
  text,
  imageUrls,
  gifUrls,
  source,
}: {
  text?: string
  imageUrls?: string[]
  gifUrls?: string[]
  source?: string
}) {
  return analyzeCombined({
    text,
    imageUrls,
    gifUrls,
    source,
  })
}

interface AnalysisResult {
  id: string
  content: string
  type: "text" | "image" | "mixed"
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

interface ManualEntryFormProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
}

export default function ManualEntryForm({ user, onUserUpdate }: ManualEntryFormProps) {
  const [content, setContent] = useState("")
  const [source, setSource] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [analysisMode, setAnalysisMode] = useState<"text" | "image" | "combined">("text")

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!content.trim() && selectedImages.length === 0) {
      setError("Please enter content or select images to analyze")
      return
    }

    setIsAnalyzing(true)

    try {
      let results: any

      if (analysisMode === "text" && content.trim()) {
        results = await analyzeText(content, source)
      } else if (analysisMode === "image" && selectedImages.length > 0) {
        const uploadResponses = await uploadImages(selectedImages)
        const imageUrls = uploadResponses.map((res: any) => res.url)
        const gifUrls = selectedImages
          .map((file, i) => isGifFile(file) ? imageUrls[i] : undefined)
          .filter((url): url is Exclude<typeof imageUrls[number], undefined> => url !== undefined)

        results = await performCombinedAnalysis({
          imageUrls,
          gifUrls: gifUrls.length > 0 ? gifUrls : undefined,
        })
      } else if (analysisMode === "combined") {
        const imageUploadResponses = selectedImages.length > 0 ? await uploadImages(selectedImages) : undefined
        const imageUrls = imageUploadResponses ? imageUploadResponses.map((res: any) => res.url) : undefined
        const gifUrls = selectedImages
          .map((file, i) => isGifFile(file) ? imageUrls?.[i] : undefined)
          .filter((url): url is string => Boolean(url))

        results = await performCombinedAnalysis({
          text: content.trim() || undefined,
          imageUrls,
          gifUrls: gifUrls.length > 0 ? gifUrls : undefined,
          source,
        })
      }

      const mockResult: AnalysisResult = {
        id: crypto.randomUUID(),
        content: content.substring(0, 100) || `${selectedImages.length} image(s)`,
        type: analysisMode === "text" ? "text" : analysisMode === "image" ? "image" : "mixed",
        timestamp: new Date().toISOString(),
        results,
      }

      setAnalysisResult(mockResult)
      const response = await saveAnalysisRecord(mockResult)
      onUserUpdate({
        ...user,
        analyses: response.analyses,
      })
    } catch (err) {
      setError("Analysis failed. Please try again.")
      console.error("[v0] Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (analysisResult) {
    return (
      <AnalysisResults
        result={analysisResult}
        onNewAnalysis={() => {
          setAnalysisResult(null)
          setContent("")
          setSource("")
          setSelectedImages([])
        }}
        title=""
        description=""
        riskColorClass=""
      />
    )
  }

  return (
    <form onSubmit={handleAnalyze} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="image">Images/GIFs</TabsTrigger>
          <TabsTrigger value="combined">Combined</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source (Optional)</Label>
            <Input
              id="source"
              placeholder="e.g., Twitter, Reddit, Instagram"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content to Analyze</Label>
            <Textarea
              id="content"
              placeholder="Paste text or social media content for analysis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAnalyzing}
              rows={8}
              className="resize-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-4 mt-4">
          <ImageUpload onImagesSelected={setSelectedImages} disabled={isAnalyzing} />
        </TabsContent>

        <TabsContent value="combined" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="content-combined">Text Content (Optional)</Label>
            <Textarea
              id="content-combined"
              placeholder="Add text context for the images..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAnalyzing}
              rows={4}
              className="resize-none"
            />
          </div>

          <ImageUpload onImagesSelected={setSelectedImages} disabled={isAnalyzing} />
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={isAnalyzing} className="w-full">
        {isAnalyzing ? "Analyzing..." : "Analyze Content"}
      </Button>
    </form>
  )
}
