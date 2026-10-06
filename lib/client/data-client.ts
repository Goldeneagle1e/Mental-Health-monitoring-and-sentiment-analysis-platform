"use client"

import type {
  AnalysisRecord,
  DailyCheckin,
  NotificationItem,
  SupportAppointment,
  SurveyAnswerValue,
  SurveyHistoryEntry,
  SocialPlatform,
} from "@/lib/user-profile"
import { apiFetch } from "@/lib/client/auth-client"

export async function submitSurveyAnswers(answers: SurveyAnswerValue[]) {
  return apiFetch<{
    assessment: {
      overallRisk: "low" | "moderate" | "high"
      stressScore: number
      anxietyScore: number
      depressionScore: number
      needsUrgentSupport: boolean
      summary: string
    }
    latestSurvey: SurveyHistoryEntry
    surveyHistory: SurveyHistoryEntry[]
  }>("/api/surveys", {
    method: "POST",
    body: JSON.stringify({ answers }),
  })
}

export async function saveAnalysisRecord(record: AnalysisRecord) {
  return apiFetch<{ analyses: AnalysisRecord[] }>("/api/analyses", {
    method: "POST",
    body: JSON.stringify({
      content: record.content,
      type: record.type,
      analyzedAt: record.timestamp,
      results: record.results,
    }),
  })
}

export async function deleteAnalysisRecord(id: string) {
  return apiFetch<{ analyses: AnalysisRecord[] }>(`/api/analyses?id=${id}`, {
    method: "DELETE",
  })
}

export async function saveAppointmentRecord(appointment: SupportAppointment) {
  return apiFetch<{ appointments: SupportAppointment[] }>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(appointment),
  })
}

export async function fetchDailyCheckins() {
  return apiFetch<{ dailyCheckins: DailyCheckin[] }>("/api/daily-checkins")
}

export async function createDailyCheckin(input: {
  title: string
  notes?: string
  scheduledDate: string
  completed?: boolean
  moodScore?: number | null
  stressScore?: number | null
  completionNote?: string
}) {
  return apiFetch<{ dailyCheckins: DailyCheckin[] }>("/api/daily-checkins", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateDailyCheckin(input: {
  id: string
  completed?: boolean
  moodScore?: number | null
  stressScore?: number | null
  completionNote?: string
}) {
  return apiFetch<{ dailyCheckins: DailyCheckin[] }>("/api/daily-checkins", {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function sendAccessRequest(input: {
  patientEmail: string
  requestType: "care_link" | "social_access"
  platform?: SocialPlatform
  note?: string
}) {
  return apiFetch<{ message: string }>("/api/access-requests", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function respondToAccessRequest(input: {
  requestId: string
  decision: "approved" | "rejected"
}) {
  return apiFetch<{ message: string; notifications: NotificationItem[] }>("/api/access-requests", {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}
