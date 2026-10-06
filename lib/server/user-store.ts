import { dbQuery } from "@/lib/server/db"
import type {
  AccessRequestType,
  BaselineAssessment,
  LinkedPatientSummary,
  LinkedTherapistSummary,
  NotificationItem,
  SocialConnection,
  SupportAppointment,
  UserProfile,
  UserRole,
} from "@/lib/user-profile"

type UserRow = {
  id: string
  email: string
  role: UserRole
  password_hash: string
  email_verified: boolean
  two_factor_enabled: boolean
  two_factor_secret: string | null
  created_at: Date
}

export async function findUserByEmail(email: string) {
  const result = await dbQuery<UserRow>(
    `SELECT id, email, role, password_hash, email_verified, two_factor_enabled, two_factor_secret, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()],
  )
  return result.rows[0] || null
}

export async function findUserById(userId: string) {
  const result = await dbQuery<UserRow>(
    `SELECT id, email, role, password_hash, email_verified, two_factor_enabled, two_factor_secret, created_at
     FROM users WHERE id = $1`,
    [userId],
  )
  return result.rows[0] || null
}

export async function createUser(email: string, passwordHash: string, role: UserRole) {
  const result = await dbQuery<UserRow>(
    `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, password_hash, email_verified, two_factor_enabled, two_factor_secret, created_at
    `,
    [email.toLowerCase(), passwordHash, role],
  )
  return result.rows[0]
}

export async function setTwoFactorSecret(userId: string, secret: string) {
  await dbQuery(
    `UPDATE users SET two_factor_secret = $2, updated_at = NOW() WHERE id = $1`,
    [userId, secret],
  )
}

export async function enableTwoFactor(userId: string) {
  await dbQuery(
    `UPDATE users SET two_factor_enabled = TRUE, updated_at = NOW() WHERE id = $1`,
    [userId],
  )
}

export async function saveSurvey(userId: string, answers: number[], assessment: BaselineAssessment) {
  await dbQuery(
    `
      INSERT INTO surveys (user_id, answers, stress_score, anxiety_score, depression_score, overall_risk, summary)
      VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7)
    `,
    [
      userId,
      JSON.stringify(answers),
      assessment.stressScore,
      assessment.anxietyScore,
      assessment.depressionScore,
      assessment.overallRisk,
      assessment.summary,
    ],
  )
}

export async function getSurveyHistory(userId: string) {
  const result = await dbQuery<{
    id: string
    answers: number[]
    stress_score: number
    anxiety_score: number
    depression_score: number
    overall_risk: string
    summary: string
    created_at: Date
  }>(
    `
      SELECT id, answers, stress_score, anxiety_score, depression_score, overall_risk, summary, created_at
      FROM surveys
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  )
  return result.rows.map((row: {
    id: string
    answers: number[]
    stress_score: number
    anxiety_score: number
    depression_score: number
    overall_risk: string
    summary: string
    created_at: Date
  }) => ({
    id: row.id,
    answers: row.answers,
    stressScore: row.stress_score,
    anxietyScore: row.anxiety_score,
    depressionScore: row.depression_score,
    overallRisk: row.overall_risk as "low" | "moderate" | "high",
    summary: row.summary,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function saveAnalysis(userId: string, analysis: {
  content: string
  type: string
  analyzedAt: string
  results: UserProfile["baselineAssessment"] & {
    indicators: string[]
    recommendations: string[]
    overall_risk?: "low" | "moderate" | "high"
    overallRisk?: "low" | "moderate" | "high"
  }
}) {
  await dbQuery(
    `
      INSERT INTO analyses (user_id, content, type, analyzed_at, results)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [userId, analysis.content, analysis.type, analysis.analyzedAt, JSON.stringify(analysis.results)],
  )
}

export async function getAnalyses(userId: string) {
  const result = await dbQuery<{
    id: string
    content: string
    type: string
    analyzed_at: Date
    results: {
      anxiety: number
      depression: number
      stress: number
      overall_risk?: "low" | "moderate" | "high"
      overallRisk?: "low" | "moderate" | "high"
      indicators: string[]
      recommendations: string[]
    }
  }>(
    `
      SELECT id, content, type, analyzed_at, results
      FROM analyses
      WHERE user_id = $1
      ORDER BY analyzed_at DESC
    `,
    [userId],
  )
  return result.rows.map((row: {
    id: string
    content: string
    type: string
    analyzed_at: Date
    results: {
      anxiety: number
      depression: number
      stress: number
      overall_risk?: "low" | "moderate" | "high"
      overallRisk?: "low" | "moderate" | "high"
      indicators: string[]
      recommendations: string[]
    }
  }) => ({
    id: row.id,
    content: row.content,
    type: row.type,
    timestamp: row.analyzed_at.toISOString(),
    results: {
      anxiety: row.results.anxiety,
      depression: row.results.depression,
      stress: row.results.stress,
      overall_risk: row.results.overall_risk || row.results.overallRisk || "low",
      indicators: row.results.indicators || [],
      recommendations: row.results.recommendations || [],
    },
  }))
}

export async function deleteAnalysis(userId: string, analysisId: string) {
  await dbQuery(`DELETE FROM analyses WHERE id = $1 AND user_id = $2`, [analysisId, userId])
}

export async function upsertSocialConnection(userId: string, connection: SocialConnection) {
  await dbQuery(
    `
      INSERT INTO social_connections (user_id, platform, username, status, auth_method, connected_at, last_sync_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      ON CONFLICT (user_id, platform)
      DO UPDATE SET
        username = EXCLUDED.username,
        status = EXCLUDED.status,
        auth_method = EXCLUDED.auth_method,
        connected_at = NOW(),
        last_sync_at = EXCLUDED.last_sync_at
    `,
    [userId, connection.platform, connection.username || "", connection.status, connection.authMethod || "demo", connection.lastSyncAt || null],
  )
}

export async function getSocialConnections(userId: string) {
  const result = await dbQuery<{
    platform: "twitter" | "reddit" | "instagram"
    username: string
    status: "connected" | "pending" | "disconnected"
    auth_method: "oauth" | "demo"
    connected_at: Date
    last_sync_at: Date | null
  }>(
    `
      SELECT platform, username, status, auth_method, connected_at, last_sync_at
      FROM social_connections
      WHERE user_id = $1
    `,
    [userId],
  )
  return result.rows
}

export async function getLinkedTherapists(patientId: string) {
  const result = await dbQuery<{
    therapist_id: string
    therapist_email: string
    created_at: Date
  }>(
    `
      SELECT tpl.therapist_id, u.email AS therapist_email, tpl.created_at
      FROM therapist_patient_links tpl
      INNER JOIN users u ON u.id = tpl.therapist_id
      WHERE tpl.patient_id = $1 AND tpl.status = 'approved'
      ORDER BY tpl.created_at DESC
    `,
    [patientId],
  )

  return result.rows.map<LinkedTherapistSummary>((row) => ({
    id: row.therapist_id,
    email: row.therapist_email,
    linkedAt: row.created_at.toISOString(),
  }))
}

export async function getLinkedPatients(therapistId: string) {
  const result = await dbQuery<{
    patient_id: string
    patient_email: string
    survey_risk: string | null
    last_survey_at: Date | null
    analysis_count: string
    latest_analysis_risk: string | null
    reddit_granted: boolean
    twitter_granted: boolean
    instagram_granted: boolean
  }>(
    `
      SELECT
        u.id AS patient_id,
        u.email AS patient_email,
        latest_survey.overall_risk AS survey_risk,
        latest_survey.created_at AS last_survey_at,
        COALESCE(analysis_stats.analysis_count, 0)::text AS analysis_count,
        analysis_stats.latest_analysis_risk,
        COALESCE(access_flags.reddit_granted, FALSE) AS reddit_granted,
        COALESCE(access_flags.twitter_granted, FALSE) AS twitter_granted,
        COALESCE(access_flags.instagram_granted, FALSE) AS instagram_granted
      FROM therapist_patient_links tpl
      INNER JOIN users u ON u.id = tpl.patient_id
      LEFT JOIN LATERAL (
        SELECT overall_risk, created_at
        FROM surveys
        WHERE user_id = u.id
        ORDER BY created_at DESC
        LIMIT 1
      ) latest_survey ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) OVER () AS analysis_count,
          results->>'overall_risk' AS latest_analysis_risk
        FROM analyses
        WHERE user_id = u.id
        ORDER BY analyzed_at DESC
        LIMIT 1
      ) analysis_stats ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          BOOL_OR(platform = 'reddit' AND status = 'approved') AS reddit_granted,
          BOOL_OR(platform = 'twitter' AND status = 'approved') AS twitter_granted,
          BOOL_OR(platform = 'instagram' AND status = 'approved') AS instagram_granted
        FROM access_requests
        WHERE therapist_id = $1 AND patient_id = u.id AND request_type = 'social_access'
      ) access_flags ON TRUE
      WHERE tpl.therapist_id = $1 AND tpl.status = 'approved'
      ORDER BY latest_survey.created_at DESC NULLS LAST, u.email ASC
    `,
    [therapistId],
  )

  return result.rows.map<LinkedPatientSummary>((row) => ({
    id: row.patient_id,
    email: row.patient_email,
    surveyRisk: (row.survey_risk as LinkedPatientSummary["surveyRisk"]) || undefined,
    lastSurveyAt: row.last_survey_at?.toISOString(),
    analysisCount: Number(row.analysis_count),
    latestAnalysisRisk: (row.latest_analysis_risk as LinkedPatientSummary["latestAnalysisRisk"]) || undefined,
    socialAccess: {
      reddit: row.reddit_granted,
      twitter: row.twitter_granted,
      instagram: row.instagram_granted,
    },
  }))
}

export async function createAccessRequest(input: {
  therapistId: string
  patientId: string
  requestType: AccessRequestType
  platform?: "twitter" | "reddit" | "instagram"
  note?: string
}) {
  await dbQuery(
    `
      INSERT INTO access_requests (therapist_id, patient_id, request_type, platform, note, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
    `,
    [input.therapistId, input.patientId, input.requestType, input.platform || null, input.note || null],
  )
}

export async function getIncomingRequests(patientId: string) {
  const result = await dbQuery<{
    id: string
    request_type: AccessRequestType
    therapist_id: string
    therapist_email: string
    platform: "twitter" | "reddit" | "instagram" | null
    note: string | null
    status: "pending" | "approved" | "rejected"
    created_at: Date
    responded_at: Date | null
  }>(
    `
      SELECT ar.id, ar.request_type, ar.therapist_id, u.email AS therapist_email, ar.platform, ar.note, ar.status, ar.created_at, ar.responded_at
      FROM access_requests ar
      INNER JOIN users u ON u.id = ar.therapist_id
      WHERE ar.patient_id = $1
      ORDER BY ar.status = 'pending' DESC, ar.created_at DESC
    `,
    [patientId],
  )

  return result.rows.map<NotificationItem>((row) => ({
    id: row.id,
    type: row.request_type,
    fromUserId: row.therapist_id,
    fromUserEmail: row.therapist_email,
    platform: row.platform || undefined,
    note: row.note || undefined,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    respondedAt: row.responded_at?.toISOString(),
  }))
}

export async function decideAccessRequest(input: {
  requestId: string
  patientId: string
  decision: "approved" | "rejected"
}) {
  const requestResult = await dbQuery<{
    id: string
    therapist_id: string
    patient_id: string
    request_type: AccessRequestType
    platform: "twitter" | "reddit" | "instagram" | null
  }>(
    `
      UPDATE access_requests
      SET status = $3, responded_at = NOW()
      WHERE id = $1 AND patient_id = $2 AND status = 'pending'
      RETURNING id, therapist_id, patient_id, request_type, platform
    `,
    [input.requestId, input.patientId, input.decision],
  )

  const request = requestResult.rows[0]
  if (!request) return null

  if (request.request_type === "care_link" && input.decision === "approved") {
    await dbQuery(
      `
        INSERT INTO therapist_patient_links (therapist_id, patient_id, status)
        VALUES ($1, $2, 'approved')
        ON CONFLICT (therapist_id, patient_id)
        DO UPDATE SET status = 'approved'
      `,
      [request.therapist_id, request.patient_id],
    )
  }

  return request
}

export async function saveAppointment(userId: string, appointment: SupportAppointment) {
  await dbQuery(
    `
      INSERT INTO appointments (id, user_id, therapist_id, therapist_name, mode, slot, notes, booked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      appointment.id,
      userId,
      appointment.therapistId,
      appointment.therapistName,
      appointment.mode,
      appointment.slot,
      appointment.notes || null,
      appointment.bookedAt,
    ],
  )
}

export async function getAppointments(userId: string) {
  const result = await dbQuery<{
    id: string
    therapist_id: string
    therapist_name: string
    mode: "online" | "in-person"
    slot: Date
    notes: string | null
    booked_at: Date
  }>(
    `
      SELECT id, therapist_id, therapist_name, mode, slot, notes, booked_at
      FROM appointments
      WHERE user_id = $1
      ORDER BY slot DESC
    `,
    [userId],
  )
  return result.rows.map((row: {
    id: string
    therapist_id: string
    therapist_name: string
    mode: "online" | "in-person"
    slot: Date
    notes: string | null
    booked_at: Date
  }) => ({
    id: row.id,
    therapistId: row.therapist_id,
    therapistName: row.therapist_name,
    mode: row.mode,
    slot: row.slot.toISOString(),
    notes: row.notes || undefined,
    bookedAt: row.booked_at.toISOString(),
  }))
}

export async function saveDailyCheckin(userId: string, input: {
  title: string
  notes?: string
  scheduledDate: string
  completed?: boolean
  moodScore?: number | null
  stressScore?: number | null
  completionNote?: string
}) {
  const result = await dbQuery<{
    id: string
  }>(
    `
      INSERT INTO daily_checkins (user_id, title, notes, scheduled_date, completed, mood_score, stress_score, completion_note)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      userId,
      input.title,
      input.notes || null,
      input.scheduledDate,
      Boolean(input.completed),
      input.moodScore ?? null,
      input.stressScore ?? null,
      input.completionNote || null,
    ],
  )
  return result.rows[0].id
}

export async function updateDailyCheckin(userId: string, checkinId: string, input: {
  completed?: boolean
  moodScore?: number | null
  stressScore?: number | null
  completionNote?: string
}) {
  await dbQuery(
    `
      UPDATE daily_checkins
      SET
        completed = COALESCE($3, completed),
        mood_score = COALESCE($4, mood_score),
        stress_score = COALESCE($5, stress_score),
        completion_note = COALESCE($6, completion_note)
      WHERE id = $1 AND user_id = $2
    `,
    [checkinId, userId, input.completed ?? null, input.moodScore ?? null, input.stressScore ?? null, input.completionNote ?? null],
  )
}

export async function getDailyCheckins(userId: string) {
  const result = await dbQuery<{
    id: string
    title: string
    notes: string | null
    scheduled_date: string
    completed: boolean
    mood_score: number | null
    stress_score: number | null
    completion_note: string | null
    created_at: Date
  }>(
    `
      SELECT id, title, notes, scheduled_date, completed, mood_score, stress_score, completion_note, created_at
      FROM daily_checkins
      WHERE user_id = $1
      ORDER BY scheduled_date DESC, created_at DESC
    `,
    [userId],
  )
  return result.rows.map((row: {
    id: string
    title: string
    notes: string | null
    scheduled_date: string
    completed: boolean
    mood_score: number | null
    stress_score: number | null
    completion_note: string | null
    created_at: Date
  }) => ({
    id: row.id,
    title: row.title,
    notes: row.notes || "",
    scheduledDate: row.scheduled_date,
    completed: row.completed,
    moodScore: row.mood_score,
    stressScore: row.stress_score,
    completionNote: row.completion_note || "",
    createdAt: row.created_at.toISOString(),
  }))
}
