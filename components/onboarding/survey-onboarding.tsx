"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { onboardingSurveyQuestions, surveyOptions, buildAssessment } from "@/lib/survey"
import type { SurveyAnswerValue, UserProfile } from "@/lib/user-profile"
import { clearActiveUser, setActiveUser } from "@/lib/user-profile"
import CrisisSupportPanel from "@/components/support/crisis-support-panel"
import { submitSurveyAnswers } from "@/lib/client/data-client"

interface SurveyOnboardingProps {
  user: UserProfile
  mode?: "first-time" | "retake"
  onComplete: (profile: UserProfile) => void
  onBackToLogin?: () => void
}

export default function SurveyOnboarding({
  user,
  mode = "first-time",
  onComplete,
  onBackToLogin,
}: SurveyOnboardingProps) {
  const [answers, setAnswers] = useState<SurveyAnswerValue[]>(
    onboardingSurveyQuestions.map(() => 0 as SurveyAnswerValue),
  )
  const [surveyConsent, setSurveyConsent] = useState(false)
  const [crisisConsent, setCrisisConsent] = useState(false)
  const [error, setError] = useState("")
  const [previewRisk, setPreviewRisk] = useState<"low" | "moderate" | "high" | null>(null)
  const [touchedQuestions, setTouchedQuestions] = useState<number[]>([])

  const answeredCount = touchedQuestions.length

  const updateAnswer = (index: number, value: SurveyAnswerValue) => {
    const nextAnswers = [...answers]
    nextAnswers[index] = value
    setAnswers(nextAnswers)
    setTouchedQuestions((current) => (current.includes(index) ? current : [...current, index]))
    setPreviewRisk(buildAssessment(nextAnswers).overallRisk)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!surveyConsent) {
      setError("Please confirm that you understand this survey is a wellness screening, not a diagnosis.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await submitSurveyAnswers(answers)
      const nextProfile: UserProfile = {
        ...user,
        hasCompletedSurvey: true,
        surveyCompletedAt: response.latestSurvey.createdAt,
        surveyAnswers: answers,
        surveyHistory: response.surveyHistory,
        baselineAssessment: response.assessment,
        consent: {
          ...user.consent,
          survey: surveyConsent,
          crisisSupport: crisisConsent,
        },
      }

      setActiveUser(nextProfile)
      onComplete(nextProfile)
    } catch (err: any) {
      setError(err.message || "Unable to save survey responses.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/60 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {mode === "retake" ? "Retake your wellness survey" : "Wellness check before analysis"}
            </CardTitle>
            <CardDescription>
              {mode === "retake"
                ? "Use this 12-question screening to refresh your current baseline and compare it with your earlier survey history."
                : "We use a short 12-question screening to understand your current baseline before analyzing posts. This helps us give safer recommendations and surface support options sooner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Survey progress</span>
                <span>{answeredCount}/{onboardingSurveyQuestions.length}</span>
              </div>
              <Progress value={(answeredCount / onboardingSurveyQuestions.length) * 100} />
            </div>

            <div className="space-y-5">
              {onboardingSurveyQuestions.map((question, index) => (
                <div key={question.id} className="rounded-xl border p-4">
                  <div className="mb-3">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">{question.domain}</p>
                    <p className="font-medium">{index + 1}. {question.prompt}</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    {surveyOptions.map((option) => {
                      const selected = answers[index] === option.value
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => updateAnswer(index, option.value)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
              <label className="flex items-start gap-3 text-sm">
                <Checkbox checked={surveyConsent} onCheckedChange={(value) => setSurveyConsent(Boolean(value))} />
                <span>I understand this survey is only a screening tool and not a medical diagnosis.</span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox checked={crisisConsent} onCheckedChange={(value) => setCrisisConsent(Boolean(value))} />
                <span>I agree that the app may show crisis resources if my responses suggest a higher level of distress.</span>
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {previewRisk && previewRisk !== "low" && (
              <CrisisSupportPanel risk={previewRisk} compact headline="Support options are available during setup" />
            )}

            <div className="flex justify-end">
              <div className="flex gap-3">
                {mode === "first-time" && onBackToLogin && (
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => {
                      clearActiveUser()
                      onBackToLogin()
                    }}
                    disabled={isSubmitting}
                  >
                    Back to sign in
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : mode === "retake" ? "Save survey" : "Continue to dashboard"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
