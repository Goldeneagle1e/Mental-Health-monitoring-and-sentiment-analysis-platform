"use client"

import { useMemo, useState } from "react"
import { BadgeCheck, Link2, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { sendAccessRequest } from "@/lib/client/data-client"
import type { SocialPlatform, UserProfile } from "@/lib/user-profile"

interface TherapistDashboardProps {
  user: UserProfile
}

const platformOptions: SocialPlatform[] = ["reddit", "twitter", "instagram"]

export default function TherapistDashboard({ user }: TherapistDashboardProps) {
  const [patientEmail, setPatientEmail] = useState("")
  const [requestMode, setRequestMode] = useState<"care_link" | "social_access">("care_link")
  const [platform, setPlatform] = useState<SocialPlatform>("reddit")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState("")

  const pendingSummary = useMemo(
    () => user.linkedPatients.filter((patient) => patient.latestAnalysisRisk === "high" || patient.surveyRisk === "high"),
    [user.linkedPatients],
  )

  async function handleSendRequest() {
    if (!patientEmail.trim()) {
      setStatus("Enter a patient email before sending a request.")
      return
    }

    try {
      const response = await sendAccessRequest({
        patientEmail: patientEmail.trim(),
        requestType: requestMode,
        platform: requestMode === "social_access" ? platform : undefined,
        note: note.trim() || undefined,
      })
      setStatus(response.message)
      setPatientEmail("")
      setNote("")
    } catch (err: any) {
      setStatus(err.message || "Unable to send request.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/60 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-sky-950">Linked patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-sky-950">{user.linkedPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/60 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-sky-950">High-priority cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-sky-950">{pendingSummary.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/60 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-sky-950">Your portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Monitor linked patients, review risk snapshots, and request social access when the patient approves.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sky-950">Send patient request</CardTitle>
          <CardDescription>Start by requesting care access or asking a patient to share a specific social platform for review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={patientEmail}
              onChange={(event) => setPatientEmail(event.target.value)}
              placeholder="Patient email"
              className="md:col-span-2"
            />
            <select
              value={requestMode}
              onChange={(event) => setRequestMode(event.target.value as "care_link" | "social_access")}
              className="h-10 rounded-md border border-sky-200 bg-white px-3"
            >
              <option value="care_link">Care link request</option>
              <option value="social_access">Social access request</option>
            </select>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
              disabled={requestMode !== "social_access"}
              className="h-10 rounded-md border border-sky-200 bg-white px-3 disabled:opacity-50"
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note explaining why you are requesting access"
            className="min-h-24 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-3">
            <Button className="bg-sky-600 text-white hover:bg-sky-700" onClick={() => void handleSendRequest()}>
              <Link2 className="mr-2 h-4 w-4" />
              Send request
            </Button>
            {status && (
              <Alert className="min-w-[280px] border-yellow-200 bg-yellow-50 text-yellow-900">
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-950">
            <Users className="h-5 w-5 text-sky-600" />
            Patient roster
          </CardTitle>
          <CardDescription>Only linked patients appear here, and social access badges show per-platform approvals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.linkedPatients.length === 0 && (
            <Alert className="border-sky-200 bg-sky-50 text-sky-900">
              <AlertDescription>No patients linked yet. Send a care request to begin monitoring a patient in the portal.</AlertDescription>
            </Alert>
          )}

          {user.linkedPatients.map((patient) => (
            <div key={patient.id} className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-sky-950">{patient.email}</p>
                  <p className="text-sm text-slate-600">
                    Latest survey: {patient.surveyRisk || "not yet completed"} {patient.lastSurveyAt ? `on ${new Date(patient.lastSurveyAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.socialAccess.reddit && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">Reddit granted</span>
                  )}
                  {patient.socialAccess.twitter && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">X granted</span>
                  )}
                  {patient.socialAccess.instagram && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">Instagram granted</span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Saved analyses</p>
                  <p className="text-2xl font-semibold text-sky-950">{patient.analysisCount}</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Latest analysis risk</p>
                  <p className="text-2xl font-semibold text-sky-950">{patient.latestAnalysisRisk || "-"}</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Baseline survey risk</p>
                  <p className="text-2xl font-semibold text-sky-950">{patient.surveyRisk || "-"}</p>
                </div>
              </div>

              {(patient.latestAnalysisRisk === "high" || patient.surveyRisk === "high") && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-900">
                  <BadgeCheck className="h-4 w-4" />
                  This patient currently shows a high-priority signal and may benefit from faster follow-up.
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
