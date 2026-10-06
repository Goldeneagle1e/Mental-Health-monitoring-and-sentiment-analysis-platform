import { type NextRequest, NextResponse } from "next/server"

const ML_SERVER_BASE_URL = 'http://localhost:8000/api/ml/analyze/gif'

interface GifAnalysisRequest {
  gifUrl: string
  frameCount?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: GifAnalysisRequest = await request.json()

    if (!body.gifUrl) {
      return NextResponse.json({ error: "GIF URL is required" }, { status: 400 })
    }

    const mlResponse = await fetch(ML_SERVER_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gifUrl: body.gifUrl, frameCount: body.frameCount || 5 }),
    })

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text()
      return new NextResponse(JSON.stringify({
        error: `ML Server returned ${mlResponse.status}. Details: ${errorText}`
      }), {
        status: mlResponse.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await mlResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] GIF analysis error:", error)
    return NextResponse.json({ error: "GIF analysis failed" }, { status: 500 })
  }
}
