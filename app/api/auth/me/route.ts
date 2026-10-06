import { NextRequest, NextResponse } from "next/server"
import { sanitizeUser } from "@/lib/server/auth"
import { requireAuth } from "@/lib/server/request-auth"
import {
  getIncomingRequests,
  getAnalyses,
  getAppointments,
  getDailyCheckins,
  getLinkedPatients,
  getLinkedTherapists,
  getSocialConnections,
  getSurveyHistory,
} from "@/lib/server/user-store"
import { createEmptyConnections } from "@/lib/user-profile"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const [surveyHistory, analyses, appointments, dailyCheckins, socialRows, notifications, linkedPatients, linkedTherapists] = await Promise.all([
      getSurveyHistory(auth.user.id),
      getAnalyses(auth.user.id),
      getAppointments(auth.user.id),
      getDailyCheckins(auth.user.id),
      getSocialConnections(auth.user.id),
      getIncomingRequests(auth.user.id),
      auth.user.role === "therapist" ? getLinkedPatients(auth.user.id) : Promise.resolve([]),
      auth.user.role === "patient" ? getLinkedTherapists(auth.user.id) : Promise.resolve([]),
    ])

    const socialConnections = createEmptyConnections()
    for (const row of socialRows) {
      socialConnections[row.platform] = {
        platform: row.platform,
        status: row.status,
        username: row.username,
        authMethod: row.auth_method,
        connectedAt: row.connected_at.toISOString(),
        lastSyncAt: row.last_sync_at?.toISOString(),
      }
    }

    const latestSurvey = surveyHistory[0]

    return NextResponse.json({
      user: {
        ...sanitizeUser(auth.user),
        hasCompletedSurvey: Boolean(latestSurvey),
        surveyCompletedAt: latestSurvey?.createdAt,
        surveyAnswers: latestSurvey?.answers || [],
        surveyHistory,
        baselineAssessment: latestSurvey
          ? {
              overallRisk: latestSurvey.overallRisk,
              stressScore: latestSurvey.stressScore,
              anxietyScore: latestSurvey.anxietyScore,
              depressionScore: latestSurvey.depressionScore,
              needsUrgentSupport: latestSurvey.overallRisk === "high",
              summary: latestSurvey.summary,
            }
          : undefined,
        consent: {
          survey: Boolean(latestSurvey),
          crisisSupport: true,
          socialImport: socialRows.length > 0,
          geolocation: false,
        },
        supportLocation: {},
        dailyCheckins,
        analyses,
        appointments,
        notifications,
        linkedPatients,
        linkedTherapists,
        socialConnections,
      },
    })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 })
  }
}
