"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnalysisMode from "@/components/analysis/analysis-mode"
import AnalysisHistory from "@/components/analysis/analysis-history"
import SurveyOnboarding from "@/components/onboarding/survey-onboarding"
import SupportHub from "@/components/support/support-hub"
import CrisisSupportPanel from "@/components/support/crisis-support-panel"
import SocialConnections from "@/components/social/social-connections"
import TaskManager from "@/components/tasks/task-manager"
import TwoFactorSettings from "@/components/auth/two-factor-settings"
import PatientNotifications from "@/components/portal/patient-notifications"
import TherapistDashboard from "@/components/portal/therapist-dashboard"
import { clearActiveUser, setActiveUser, type UserProfile } from "@/lib/user-profile"

interface DashboardProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
}

export default function Dashboard({ user, onUserUpdate }: DashboardProps) {
  const [currentView, setCurrentView] = useState<"home" | "analyze" | "history" | "support" | "tasks" | "survey">("home")
  const analysisHistory = useMemo(() => user.analyses || [], [user.analyses])
  const highRiskCount = analysisHistory.filter((item) => item.results.overall_risk === "high").length
  const canRetakeSurvey = useMemo(() => {
    if (!user.surveyCompletedAt) return true
    const lastSurveyDate = new Date(user.surveyCompletedAt)
    const now = new Date()
    return lastSurveyDate.toDateString() !== now.toDateString()
  }, [user.surveyCompletedAt])

  const handleLogout = () => {
    clearActiveUser()
    window.location.reload()
  }

  if (user.role === "therapist") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/60 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-sky-950">Therapist Portal</h1>
              <p className="text-sm text-slate-600">Monitor linked patients, review trends, and request approved social access.</p>
            </div>
            <Button variant="outline" className="border-sky-200 bg-white" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
            <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sky-950">Care overview</CardTitle>
                <CardDescription>
                  Your therapist account can only see patients who approved a care-link request, and social access remains platform-specific.
                </CardDescription>
              </CardHeader>
            </Card>
            <TwoFactorSettings
              user={user}
              onUserUpdate={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
              }}
            />
          </div>

          <TherapistDashboard user={user} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sky-950">Mental Health Analysis</h1>
            <p className="text-sm text-slate-600">A brighter daily space for mental health check-ins, support, and early insight.</p>
          </div>
          <Button variant="outline" className="border-sky-200 bg-white" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === "home" && (
          <div className="space-y-6">
            <PatientNotifications
              user={user}
              onUserUpdate={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
              }}
            />

            {user.baselineAssessment && user.baselineAssessment.overallRisk !== "low" && (
              <CrisisSupportPanel risk={user.baselineAssessment.overallRisk} onBookSupport={() => setCurrentView("support")} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentView("analyze")}
              >
                <CardHeader>
                  <CardTitle>New Analysis</CardTitle>
                  <CardDescription>Analyze text, images, or social media content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose between real-time analysis or manual entry to detect early signs of mental health concerns.
                  </p>
                  <Button className="w-full">Start Analysis</Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentView("history")}
              >
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>View your previous analyses and reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Access all your past analyses, results, and generated reports.
                  </p>
                  <Button className="w-full bg-transparent" variant="outline">
                    View History
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setCurrentView("tasks")}
              >
                <CardHeader>
                  <CardTitle>Daily Task Manager</CardTitle>
                  <CardDescription>Track mental health check-ins and daily progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Plan routines, complete check-ins, and log mood or stress on a daily basis.
                  </p>
                  <Button className="w-full bg-transparent" variant="outline">
                    Open Tasks
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your baseline summary</CardTitle>
                  <CardDescription>Saved from the 12-question wellness survey you completed at sign-in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-xs text-muted-foreground">Stress</p>
                      <p className="text-2xl font-semibold">{user.baselineAssessment?.stressScore ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-xs text-muted-foreground">Anxiety</p>
                      <p className="text-2xl font-semibold">{user.baselineAssessment?.anxietyScore ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-xs text-muted-foreground">Depression</p>
                      <p className="text-2xl font-semibold">{user.baselineAssessment?.depressionScore ?? 0}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.baselineAssessment?.summary}</p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setCurrentView("survey")}
                    disabled={!canRetakeSurvey}
                  >
                    {canRetakeSurvey ? "Retake survey" : "Survey already completed today"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk trend snapshot</CardTitle>
                  <CardDescription>We compare your baseline with the pattern in your saved analyses.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Saved analyses</p>
                    <p className="text-2xl font-semibold">{analysisHistory.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">High-risk analyses</p>
                    <p className="text-2xl font-semibold">{highRiskCount}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {highRiskCount > 1
                      ? "There have been repeated high-risk results. It would be wise to open the support hub and talk to someone."
                      : "Use history to notice whether stress or low mood is increasing over time."}
                  </p>
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setCurrentView("support")}>
                    Open Support Hub
                  </Button>
                </CardContent>
              </Card>
            </div>

            <SocialConnections
              user={user}
              onUpdateUser={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
              }}
            />

            <TwoFactorSettings
              user={user}
              onUserUpdate={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">1</div>
                    <h3 className="font-semibold">Input Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide text, images, or links from social media platforms
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">2</div>
                    <h3 className="font-semibold">ML Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Our LSTM + BERT models analyze the content for mental health indicators
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">3</div>
                    <h3 className="font-semibold">Get Results</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive detailed reports with risk assessment and recommendations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === "analyze" && (
          <AnalysisMode
            user={user}
            onUserUpdate={(nextUser) => {
              setActiveUser(nextUser)
              onUserUpdate(nextUser)
            }}
            onBack={() => setCurrentView("home")}
          />
        )}

        {currentView === "history" && (
          <AnalysisHistory
            user={user}
            onUserUpdate={(nextUser) => {
              setActiveUser(nextUser)
              onUserUpdate(nextUser)
            }}
            onBack={() => setCurrentView("home")}
          />
        )}

        {currentView === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Support Hub</h2>
                <p className="text-sm text-muted-foreground">Therapist discovery, crisis resources, and safer next steps.</p>
              </div>
              <Button variant="outline" onClick={() => setCurrentView("home")}>
                Back
              </Button>
            </div>

            <SupportHub
              user={user}
              onUpdateUser={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
              }}
            />
          </div>
        )}

        {currentView === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Daily Task Manager</h2>
                <p className="text-sm text-muted-foreground">Create daily wellness tasks and track your mental health progress over time.</p>
              </div>
              <Button variant="outline" onClick={() => setCurrentView("home")}>
                Back
              </Button>
            </div>

            <TaskManager
              user={user}
              onUserUpdate={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
              }}
            />
          </div>
        )}

        {currentView === "survey" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Survey Refresh</h2>
                <p className="text-sm text-muted-foreground">Refresh your daily baseline once per day to compare with post analysis.</p>
              </div>
              <Button variant="outline" onClick={() => setCurrentView("home")}>
                Back
              </Button>
            </div>

            <SurveyOnboarding
              user={user}
              mode="retake"
              onComplete={(nextUser) => {
                setActiveUser(nextUser)
                onUserUpdate(nextUser)
                setCurrentView("home")
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
