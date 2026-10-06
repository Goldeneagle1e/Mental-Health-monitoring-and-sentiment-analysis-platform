"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ManualEntryForm from "./manual-entry-form"
import RealTimeAnalysis from "./real-time-analysis"
import type { UserProfile } from "@/lib/user-profile"

interface AnalysisModeProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
  onBack: () => void
}

export default function AnalysisMode({ user, onUserUpdate, onBack }: AnalysisModeProps) {
  const [analysisMode, setAnalysisMode] = useState<"manual" | "realtime">("manual")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analysis</h2>
          <p className="text-sm text-muted-foreground">Choose your analysis method</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Analysis Method</CardTitle>
          <CardDescription>Choose between manual entry or real-time social media analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as "manual" | "realtime")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="realtime">Real-Time Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-6">
              <ManualEntryForm user={user} onUserUpdate={onUserUpdate} />
            </TabsContent>

            <TabsContent value="realtime" className="mt-6">
              <RealTimeAnalysis user={user} onUserUpdate={onUserUpdate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
