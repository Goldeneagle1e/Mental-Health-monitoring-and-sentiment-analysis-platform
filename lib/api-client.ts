export interface AnalysisRequest {
  text?: string
  imageUrls?: string[]
  gifUrls?: string[]
  source?: string
}

export interface AnalysisResult {
  anxiety: number
  depression: number
  stress: number
  overall_risk: "low" | "moderate" | "high"
  indicators: string[]
  recommendations: string[]
}

export async function analyzeText(content: string, source?: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, source }),
  })

  if (!response.ok) {
    throw new Error("Text analysis failed")
  }

  return response.json()
}

export async function analyzeImage(imageUrl: string, description?: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, description }),
  })

  if (!response.ok) {
    throw new Error("Image analysis failed")
  }

  return response.json()
}

export async function analyzeGif(gifUrl: string, frameCount: number): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze/gif", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gifUrl, frameCount }),
  })

  if (!response.ok) {
    throw new Error("GIF analysis failed")
  }

  return response.json()
}

export async function analyzeCombined(request: AnalysisRequest): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze/combined", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error("Combined analysis failed")
  }

  return response.json()
}

export async function fetchSocialMediaContent({
  platform,
  username,
  url,
}: {
  platform: string
  username?: string
  url?: string
}): Promise<any> {
  const response = await fetch("/api/social-media/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, username, url }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Failed to fetch social media content" }))
    throw new Error(payload.error || "Failed to fetch social media content")
  }

  return response.json()
}
