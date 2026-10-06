"use client"

import { useMemo, useState } from "react"
import { MapPin, Video, CalendarDays, Phone } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { UserProfile } from "@/lib/user-profile"
import { setActiveUser } from "@/lib/user-profile"
import { therapistDirectory } from "@/lib/support-resources"
import CrisisSupportPanel from "@/components/support/crisis-support-panel"
import { saveAppointmentRecord } from "@/lib/client/data-client"

interface SupportHubProps {
  user: UserProfile
  onUpdateUser: (nextUser: UserProfile) => void
}

export default function SupportHub({ user, onUpdateUser }: SupportHubProps) {
  const [city, setCity] = useState(user.supportLocation?.city || "")
  const [pincode, setPincode] = useState(user.supportLocation?.pincode || "")
  const [mode, setMode] = useState<"all" | "online" | "in-person">("all")
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [appointmentMode, setAppointmentMode] = useState<"online" | "in-person">("online")
  const [appointmentSlot, setAppointmentSlot] = useState("")
  const [appointmentNotes, setAppointmentNotes] = useState("")

  const filteredTherapists = useMemo(() => {
    return therapistDirectory.filter((therapist) => {
      const matchesCity = city ? therapist.city.toLowerCase().includes(city.toLowerCase()) : true
      const matchesPincode = pincode ? therapist.pincode.startsWith(pincode) : true
      const matchesMode = mode === "all" ? true : therapist.mode.includes(mode)
      return matchesCity && matchesPincode && matchesMode
    })
  }, [city, pincode, mode])

  const persistLocation = () => {
    const nextUser: UserProfile = {
      ...user,
      supportLocation: {
        ...user.supportLocation,
        city,
        pincode,
      },
    }
    setActiveUser(nextUser)
    onUpdateUser(nextUser)
    setStatus("Support location preferences saved.")
  }

  const therapistSelection = therapistDirectory.find((item) => item.id === selectedTherapist) || null

  const bookAppointment = async () => {
    if (!therapistSelection || !appointmentSlot) {
      setStatus("Choose a therapist and preferred date/time before booking.")
      return
    }

    if (!therapistSelection.mode.includes(appointmentMode)) {
      setStatus("This therapist does not offer the selected session mode.")
      return
    }

    const appointment = {
      id: crypto.randomUUID(),
      therapistId: therapistSelection.id,
      therapistName: therapistSelection.name,
      mode: appointmentMode,
      slot: appointmentSlot,
      notes: appointmentNotes.trim() || undefined,
      bookedAt: new Date().toISOString(),
    }

    const response = await saveAppointmentRecord(appointment)
    const nextUser: UserProfile = {
      ...user,
      appointments: response.appointments,
    }
    setActiveUser(nextUser)
    onUpdateUser(nextUser)
    setAppointmentNotes("")
    setAppointmentSlot("")
    setStatus(`Appointment requested with ${therapistSelection.name}.`)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported in this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextUser: UserProfile = {
          ...user,
          consent: { ...user.consent, geolocation: true },
          supportLocation: {
            ...user.supportLocation,
            city,
            pincode,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }
        setActiveUser(nextUser)
        onUpdateUser(nextUser)
        setStatus("Current location captured for nearby support matching. Add city or pincode for better therapist filtering.")
      },
      () => {
        setStatus("Location access was denied. You can still filter therapists by city or pincode.")
      },
    )
  }

  return (
    <div className="space-y-6">
      {user.baselineAssessment && user.baselineAssessment.overallRisk !== "low" && (
        <CrisisSupportPanel
          risk={user.baselineAssessment.overallRisk}
          onBookSupport={() => setSelectedTherapist(filteredTherapists[0]?.id || therapistDirectory[0]?.id || null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Find a therapist</CardTitle>
          <CardDescription>
            Filter by city, pincode, and session mode. You can choose online sessions or in-person visits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
            <Input value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="Pincode" />
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as "all" | "online" | "in-person")}
              className="h-10 rounded-md border bg-background px-3"
            >
              <option value="all">All modes</option>
              <option value="online">Online only</option>
              <option value="in-person">In-person only</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={persistLocation} className="flex-1">Save filters</Button>
              <Button variant="outline" onClick={useCurrentLocation} className="flex-1 bg-transparent">
                Use GPS
              </Button>
            </div>
          </div>

          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredTherapists.map((therapist) => (
          <Card key={therapist.id} className={selectedTherapist === therapist.id ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle className="text-lg">{therapist.name}</CardTitle>
              <CardDescription>{therapist.specialty}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {therapist.city} - {therapist.pincode}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {therapist.availability}
              </div>
              <p><span className="font-medium">Languages:</span> {therapist.languages.join(", ")}</p>
              <p><span className="font-medium">Fee:</span> {therapist.feeRange}</p>
              <div className="flex flex-wrap gap-2">
                {therapist.mode.includes("online") && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Video className="mr-1 inline h-3 w-3" />
                    Online
                  </span>
                )}
                {therapist.mode.includes("in-person") && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    In-person
                  </span>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Button
                  onClick={() => {
                    setSelectedTherapist(therapist.id)
                    setAppointmentMode(therapist.mode.includes("online") ? "online" : "in-person")
                  }}
                >
                  Book session
                </Button>
                <Button variant="outline" className="bg-transparent">
                  <Phone className="mr-2 h-4 w-4" />
                  Request callback
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {therapistSelection && (
        <Card>
          <CardHeader>
            <CardTitle>Book with {therapistSelection.name}</CardTitle>
            <CardDescription>
              Choose whether you want an online session or an in-person visit, then request a preferred slot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={appointmentMode}
                onChange={(event) => setAppointmentMode(event.target.value as "online" | "in-person")}
                className="h-10 rounded-md border bg-background px-3"
              >
                {therapistSelection.mode.includes("online") && <option value="online">Online session</option>}
                {therapistSelection.mode.includes("in-person") && <option value="in-person">In-person visit</option>}
              </select>
              <Input
                type="datetime-local"
                value={appointmentSlot}
                onChange={(event) => setAppointmentSlot(event.target.value)}
              />
              <Button onClick={bookAppointment}>Confirm appointment</Button>
            </div>
            <textarea
              value={appointmentNotes}
              onChange={(event) => setAppointmentNotes(event.target.value)}
              placeholder="Optional notes for the therapist"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>
      )}

      {user.appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming support requests</CardTitle>
            <CardDescription>Your saved online or in-person appointment requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium">{appointment.therapistName}</p>
                <p className="text-muted-foreground">
                  {appointment.mode === "online" ? "Online session" : "In-person visit"} on{" "}
                  {new Date(appointment.slot).toLocaleString()}
                </p>
                {appointment.notes && <p className="mt-2 text-muted-foreground">{appointment.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {filteredTherapists.length === 0 && (
        <Alert>
          <AlertTitle>No matches yet</AlertTitle>
          <AlertDescription>
            Try clearing a filter or switching to online sessions to widen the support network.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
