"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { DailyCheckin, UserProfile } from "@/lib/user-profile"
import { createDailyCheckin, updateDailyCheckin } from "@/lib/client/data-client"

interface TaskManagerProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
}

export default function TaskManager({ user, onUserUpdate }: TaskManagerProps) {
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const tasks = user.dailyCheckins || []

  const completedCount = useMemo(() => tasks.filter((item) => item.completed).length, [tasks])
  const averageMood = useMemo(() => {
    const scored = tasks.filter((item) => typeof item.moodScore === "number")
    if (!scored.length) return null
    return Math.round(scored.reduce((sum, item) => sum + (item.moodScore || 0), 0) / scored.length)
  }, [tasks])

  async function handleCreateTask() {
    if (!title.trim()) {
      setStatus("Add a task title before saving.")
      return
    }

    setIsSaving(true)
    try {
      const response = await createDailyCheckin({
        title: title.trim(),
        notes: notes.trim() || undefined,
        scheduledDate,
      })
      onUserUpdate({
        ...user,
        dailyCheckins: response.dailyCheckins,
      })
      setTitle("")
      setNotes("")
      setStatus("Daily check-in saved.")
    } catch (err: any) {
      setStatus(err.message || "Unable to save task.")
    } finally {
      setIsSaving(false)
    }
  }

  async function markComplete(task: DailyCheckin) {
    const moodScore = Number(window.prompt("Mood score for today (0-100):", task.moodScore?.toString() || "70"))
    const stressScore = Number(window.prompt("Stress score for today (0-100):", task.stressScore?.toString() || "30"))
    const completionNote = window.prompt("Anything you want to note about today?", task.completionNote || "") || ""

    const response = await updateDailyCheckin({
      id: task.id,
      completed: true,
      moodScore: Number.isFinite(moodScore) ? moodScore : null,
      stressScore: Number.isFinite(stressScore) ? stressScore : null,
      completionNote,
    })

    onUserUpdate({
      ...user,
      dailyCheckins: response.dailyCheckins,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average mood</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{averageMood ?? "-"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a daily check-in</CardTitle>
          <CardDescription>Use this to plan a routine, self-check, or support action you want to complete today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" />
            <Input value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} type="date" />
            <Button onClick={handleCreateTask} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save check-in"}
            </Button>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes"
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-in history</CardTitle>
          <CardDescription>Complete tasks and log how your mood and stress moved over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && (
            <Alert>
              <AlertDescription>No daily check-ins yet. Create one above to start tracking progress.</AlertDescription>
            </Alert>
          )}

          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.scheduledDate}</p>
                  {task.notes && <p className="mt-2 text-sm text-muted-foreground">{task.notes}</p>}
                  {task.completed && (
                    <p className="mt-2 text-sm">
                      Mood: {task.moodScore ?? "-"} | Stress: {task.stressScore ?? "-"} | {task.completionNote || "Completed"}
                    </p>
                  )}
                </div>
                <Button
                  variant={task.completed ? "outline" : "default"}
                  className={task.completed ? "bg-transparent" : undefined}
                  onClick={() => void markComplete(task)}
                  disabled={task.completed}
                >
                  {task.completed ? "Completed" : "Mark complete"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
