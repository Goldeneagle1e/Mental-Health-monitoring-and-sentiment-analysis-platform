import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/request-auth"
import { getSurveyHistory, saveSurvey } from "@/lib/server/user-store"
import { buildAssessment } from "@/lib/survey"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const surveyHistory = await getSurveyHistory(auth.user.id)
    return NextResponse.json({ surveyHistory })
  } catch (error) {
    console.error("Survey history error:", error)
    return NextResponse.json({ error: "Failed to fetch survey history." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const { answers } = await request.json()
    if (!Array.isArray(answers) || answers.length !== 12) {
      return NextResponse.json({ error: "All 12 survey answers are required." }, { status: 400 })
    }

    const assessment = buildAssessment(answers)
    await saveSurvey(auth.user.id, answers, assessment)
    const surveyHistory = await getSurveyHistory(auth.user.id)

    return NextResponse.json({
      assessment,
      latestSurvey: surveyHistory[0],
      surveyHistory,
    })
  } catch (error) {
    console.error("Survey save error:", error)
    return NextResponse.json({ error: "Failed to save survey." }, { status: 500 })
  }
}
