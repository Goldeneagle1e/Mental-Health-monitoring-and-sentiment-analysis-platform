export type SurveyAnswerValue = 0 | 1 | 2 | 3
export type RiskLevel = "low" | "moderate" | "high"
export type SocialPlatform = "twitter" | "reddit" | "instagram"
export type UserRole = "patient" | "therapist"
export type AccessRequestType = "care_link" | "social_access"

export interface BaselineAssessment {
  overallRisk: RiskLevel
  stressScore: number
  anxietyScore: number
  depressionScore: number
  needsUrgentSupport: boolean
  summary: string
}

export interface ConsentFlags {
  survey: boolean
  crisisSupport: boolean
  socialImport: boolean
  geolocation: boolean
}

export interface SocialConnection {
  platform: SocialPlatform
  status: "disconnected" | "pending" | "connected"
  username?: string
  connectedAt?: string
  authMethod?: "oauth" | "demo"
  lastSyncAt?: string
}

export interface NotificationItem {
  id: string
  type: AccessRequestType
  fromUserId: string
  fromUserEmail: string
  platform?: SocialPlatform
  note?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  respondedAt?: string
}

export interface LinkedPatientSummary {
  id: string
  email: string
  surveyRisk?: RiskLevel
  lastSurveyAt?: string
  analysisCount: number
  latestAnalysisRisk?: RiskLevel
  socialAccess: Partial<Record<SocialPlatform, boolean>>
}

export interface LinkedTherapistSummary {
  id: string
  email: string
  linkedAt: string
}

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  createdAt: string
  emailVerified?: boolean
  twoFactorEnabled?: boolean
  hasCompletedSurvey: boolean
  surveyCompletedAt?: string
  surveyAnswers: SurveyAnswerValue[]
  surveyHistory: SurveyHistoryEntry[]
  baselineAssessment?: BaselineAssessment
  consent: ConsentFlags
  supportLocation?: {
    city?: string
    pincode?: string
    latitude?: number
    longitude?: number
  }
  dailyCheckins: DailyCheckin[]
  analyses: AnalysisRecord[]
  appointments: SupportAppointment[]
  notifications: NotificationItem[]
  linkedPatients: LinkedPatientSummary[]
  linkedTherapists: LinkedTherapistSummary[]
  socialConnections: Record<SocialPlatform, SocialConnection>
}

export interface SurveyHistoryEntry {
  id: string
  answers: number[]
  stressScore: number
  anxietyScore: number
  depressionScore: number
  overallRisk: RiskLevel
  summary: string
  createdAt: string
}

export interface SupportAppointment {
  id: string
  therapistId: string
  therapistName: string
  mode: "online" | "in-person"
  slot: string
  notes?: string
  bookedAt: string
}

export interface DailyCheckin {
  id: string
  title: string
  notes?: string
  scheduledDate: string
  completed: boolean
  moodScore?: number | null
  stressScore?: number | null
  completionNote?: string
  createdAt: string
}

export interface AnalysisRecord {
  id: string
  content: string
  type: string
  timestamp: string
  results: {
    anxiety: number
    depression: number
    stress: number
    overall_risk: RiskLevel
    indicators: string[]
    recommendations: string[]
  }
}

const ACTIVE_USER_KEY = "user"
const ACCESS_TOKEN_KEY = "mh-access-token"

export function createEmptyConnections(): Record<SocialPlatform, SocialConnection> {
  return {
    twitter: { platform: "twitter", status: "disconnected" },
    reddit: { platform: "reddit", status: "disconnected" },
    instagram: { platform: "instagram", status: "disconnected" },
  }
}

export function normalizeUserProfile(profile: Partial<UserProfile>): UserProfile {
  return {
    id: profile.id || crypto.randomUUID(),
    email: profile.email || "",
    role: profile.role || "patient",
    createdAt: profile.createdAt || new Date().toISOString(),
    emailVerified: Boolean(profile.emailVerified),
    twoFactorEnabled: Boolean(profile.twoFactorEnabled),
    hasCompletedSurvey: Boolean(profile.hasCompletedSurvey),
    surveyCompletedAt: profile.surveyCompletedAt,
    surveyAnswers: profile.surveyAnswers || [],
    surveyHistory: profile.surveyHistory || [],
    baselineAssessment: profile.baselineAssessment,
    consent: {
      survey: Boolean(profile.consent?.survey),
      crisisSupport: Boolean(profile.consent?.crisisSupport),
      socialImport: Boolean(profile.consent?.socialImport),
      geolocation: Boolean(profile.consent?.geolocation),
    },
    supportLocation: profile.supportLocation,
    dailyCheckins: profile.dailyCheckins || [],
    analyses: profile.analyses || [],
    appointments: profile.appointments || [],
    notifications: profile.notifications || [],
    linkedPatients: profile.linkedPatients || [],
    linkedTherapists: profile.linkedTherapists || [],
    socialConnections: {
      ...createEmptyConnections(),
      ...profile.socialConnections,
    },
  }
}

export function createUserProfile(email: string, password: string): UserProfile {
  return {
    id: crypto.randomUUID(),
    email,
    role: "patient",
    createdAt: new Date().toISOString(),
    hasCompletedSurvey: false,
    surveyAnswers: [],
    surveyHistory: [],
    consent: {
      survey: false,
      crisisSupport: false,
      socialImport: false,
      geolocation: false,
    },
    dailyCheckins: [],
    analyses: [],
    appointments: [],
    notifications: [],
    linkedPatients: [],
    linkedTherapists: [],
    socialConnections: createEmptyConnections(),
  }
}

export function setActiveUser(profile: UserProfile) {
  const normalized = normalizeUserProfile(profile)
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(normalized))
}

export function getActiveUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY)
    return raw ? normalizeUserProfile(JSON.parse(raw) as Partial<UserProfile>) : null
  } catch {
    return null
  }
}

export function refreshActiveUserFromStore(): UserProfile | null {
  return getActiveUser()
}

export function clearActiveUser() {
  localStorage.removeItem(ACTIVE_USER_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function mergeProfileData(current: UserProfile | null, next: Partial<UserProfile>) {
  return normalizeUserProfile({
    ...current,
    ...next,
  })
}
