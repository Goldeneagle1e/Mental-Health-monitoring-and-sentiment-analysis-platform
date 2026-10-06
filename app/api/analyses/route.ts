import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/request-auth"
import { deleteAnalysis, getAnalyses, saveAnalysis } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const analyses = await getAnalyses(auth.user.id)
    return NextResponse.json({ analyses })
  } catch (error) {
    console.error("Analysis fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch analyses." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const analysis = await request.json()
    await saveAnalysis(auth.user.id, analysis)
    const analyses = await getAnalyses(auth.user.id)
    return NextResponse.json({ analyses })
  } catch (error) {
    console.error("Analysis save error:", error)
    return NextResponse.json({ error: "Failed to save analysis." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Analysis id is required." }, { status: 400 })
    }

    await deleteAnalysis(auth.user.id, id)
    const analyses = await getAnalyses(auth.user.id)
    return NextResponse.json({ analyses })
  } catch (error) {
    console.error("Analysis delete error:", error)
    return NextResponse.json({ error: "Failed to delete analysis." }, { status: 500 })
  }
}
