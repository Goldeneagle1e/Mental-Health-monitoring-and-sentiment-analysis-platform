"use client"

import { AlertTriangle, PhoneCall } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { crisisResourcesIndia, buildSupportRecommendations } from "@/lib/support-resources"
import type { RiskLevel } from "@/lib/user-profile"

interface CrisisSupportPanelProps {
  risk: RiskLevel
  headline?: string
  compact?: boolean
  onBookSupport?: () => void
}

export default function CrisisSupportPanel({
  risk,
  headline,
  compact = false,
  onBookSupport,
}: CrisisSupportPanelProps) {
  if (risk === "low") return null

  const recommendations = buildSupportRecommendations(risk)

  return (
    <div className="space-y-4">
      <Alert variant={risk === "high" ? "destructive" : "default"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{headline || (risk === "high" ? "Immediate support is recommended" : "Support may help right now")}</AlertTitle>
        <AlertDescription>
          {risk === "high"
            ? "Your recent responses suggest a high level of distress. Please consider reaching out to someone in real life and using a crisis support option now."
            : "Your responses suggest elevated strain. It may help to speak with a trusted person and schedule support early."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Immediate support options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {recommendations.map((item) => (
              <div key={item} className="rounded-lg bg-muted p-3 text-sm">
                {item}
              </div>
            ))}
          </div>

          {!compact && (
            <div className="grid gap-3 md:grid-cols-2">
              {crisisResourcesIndia.map((resource) => (
                <div key={resource.name} className="rounded-lg border p-4">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <PhoneCall className="h-4 w-4" />
                    {resource.name}
                  </div>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                  <p className="mt-2 font-medium">{resource.phone}</p>
                  <p className="text-xs text-muted-foreground">{resource.availability}</p>
                  <a
                    href={resource.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-primary underline underline-offset-4"
                  >
                    Source: {resource.sourceLabel}
                  </a>
                </div>
              ))}
            </div>
          )}

          {onBookSupport && (
            <Button onClick={onBookSupport} className="w-full">
              Book therapist support
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
