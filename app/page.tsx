"use client"

import { useEffect, useState } from "react"
import LoginPage from "@/components/auth/login-page"
import Dashboard from "@/components/dashboard/dashboard"
import SurveyOnboarding from "@/components/onboarding/survey-onboarding"
import { fetchAuthenticatedProfile } from "@/lib/client/auth-client"
import { clearActiveUser, getAccessToken, setActiveUser, type UserProfile } from "@/lib/user-profile"

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const token = getAccessToken()
      if (!token) {
        clearActiveUser()
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const payload = await fetchAuthenticatedProfile()
        setActiveUser(payload.user)
        setUser(payload.user)
      } catch {
        clearActiveUser()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />
  }

  if (user.role === "patient" && !user.hasCompletedSurvey) {
    return <SurveyOnboarding user={user} mode="first-time" onComplete={setUser} onBackToLogin={() => setUser(null)} />
  }

  return <Dashboard user={user} onUserUpdate={setUser} />
}
