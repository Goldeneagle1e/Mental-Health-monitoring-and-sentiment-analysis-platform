"use client"

import { BellRing, CheckCircle2, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { respondToAccessRequest } from "@/lib/client/data-client"
import { fetchAuthenticatedProfile } from "@/lib/client/auth-client"
import type { NotificationItem, UserProfile } from "@/lib/user-profile"

interface PatientNotificationsProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
}

function notificationLabel(notification: NotificationItem) {
  if (notification.type === "care_link") {
    return "Therapist care access request"
  }
  return `Social access request${notification.platform ? ` for ${notification.platform}` : ""}`
}

export default function PatientNotifications({ user, onUserUpdate }: PatientNotificationsProps) {
  const notifications = user.notifications || []

  async function handleDecision(requestId: string, decision: "approved" | "rejected") {
    await respondToAccessRequest({ requestId, decision })
    const refreshed = await fetchAuthenticatedProfile()
    onUserUpdate(refreshed.user)
  }

  return (
    <Card className="border-white/60 bg-white/80 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-950">
          <BellRing className="h-5 w-5 text-sky-600" />
          Requests and approvals
        </CardTitle>
        <CardDescription>Therapists can ask to monitor your care progress or request access to your social activity for analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 && (
          <Alert className="border-sky-200 bg-sky-50 text-sky-900">
            <AlertDescription>No pending requests right now.</AlertDescription>
          </Alert>
        )}

        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sky-950">{notificationLabel(notification)}</p>
                <p className="text-sm text-slate-600">From {notification.fromUserEmail}</p>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">
                {notification.status}
              </span>
            </div>

            {notification.note && <p className="mb-3 text-sm text-slate-700">{notification.note}</p>}

            <p className="mb-3 text-xs text-slate-500">
              Requested on {new Date(notification.createdAt).toLocaleString()}
            </p>

            {notification.status === "pending" ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-sky-600 text-white hover:bg-sky-700"
                  onClick={() => void handleDecision(notification.id, "approved")}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300 bg-white"
                  onClick={() => void handleDecision(notification.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                {notification.respondedAt
                  ? `Responded on ${new Date(notification.respondedAt).toLocaleString()}`
                  : "Request handled"}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
