"use client"

import { useState } from "react"
import { CheckCircle2, Link2, ShieldCheck, Unplug } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { SocialPlatform, UserProfile } from "@/lib/user-profile"
import { apiFetch } from "@/lib/client/auth-client"

interface SocialConnectionsProps {
  user: UserProfile
  onUpdateUser: (nextUser: UserProfile) => void
}

const platformLabels: Record<SocialPlatform, string> = {
  twitter: "X / Twitter",
  reddit: "Reddit",
  instagram: "Instagram",
}

export default function SocialConnections({ user, onUpdateUser }: SocialConnectionsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("twitter")
  const [username, setUsername] = useState("")
  const [consentChecked, setConsentChecked] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const connectPlatform = async () => {
    if (!username.trim() || !consentChecked) {
      setStatusMessage("Enter your handle and confirm consent before connecting a social account.")
      return
    }

    const payload = await apiFetch<{
      message: string
      connection: {
        status: "connected"
        username: string
        connectedAt: string
        authMethod: "oauth" | "demo"
      }
    }>("/api/social-media/connect", {
      method: "POST",
      body: JSON.stringify({
        platform: selectedPlatform,
        username: username.trim(),
        consent: true,
      }),
    })

    const nextUser: UserProfile = {
      ...user,
      consent: { ...user.consent, socialImport: true },
      socialConnections: {
        ...user.socialConnections,
        [selectedPlatform]: {
          platform: selectedPlatform,
          status: payload.connection.status,
          username: payload.connection.username,
          connectedAt: payload.connection.connectedAt,
          authMethod: payload.connection.authMethod,
        },
      },
    }

    setStatusMessage(payload.message)
    onUpdateUser(nextUser)
  }

  const disconnectPlatform = async (platform: SocialPlatform) => {
    const payload = await apiFetch<{ message: string }>("/api/social-media/connect", {
      method: "DELETE",
      body: JSON.stringify({ platform }),
    })

    const nextUser: UserProfile = {
      ...user,
      socialConnections: {
        ...user.socialConnections,
        [platform]: { platform, status: "disconnected" },
      },
    }
    setStatusMessage(payload.message || `${platformLabels[platform]} disconnected.`)
    onUpdateUser(nextUser)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected social accounts</CardTitle>
        <CardDescription>
          Connect your own profile before importing posts. This keeps analysis user-authorized and makes ownership explicit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(platformLabels) as SocialPlatform[]).map((platform) => {
            const connection = user.socialConnections[platform]
            return (
              <div key={platform} className="rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{platformLabels[platform]}</p>
                  {connection.status === "connected" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {connection.status === "connected"
                    ? `Connected as @${connection.username} (${connection.authMethod || "oauth"})`
                    : "Not connected"}
                </p>
                {connection.status === "connected" && (
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => disconnectPlatform(platform)}
                  >
                    <Unplug className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <select
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value as SocialPlatform)}
              className="h-10 rounded-md border bg-background px-3"
            >
              {(Object.keys(platformLabels) as SocialPlatform[]).map((platform) => (
                <option key={platform} value={platform}>
                  {platformLabels[platform]}
                </option>
              ))}
            </select>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your handle or username"
              className="h-10 rounded-md border bg-background px-3"
            />
          </div>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <Checkbox checked={consentChecked} onCheckedChange={(value) => setConsentChecked(Boolean(value))} />
            <span>I confirm this is my own account and I consent to importing my posts for analysis.</span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={connectPlatform}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Connect account
            </Button>
            <p className="text-xs text-muted-foreground">
              OAuth-ready flow. If provider credentials are not configured, the app uses a clearly labeled demo connection.
            </p>
          </div>
        </div>

        {statusMessage && (
          <Alert>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
