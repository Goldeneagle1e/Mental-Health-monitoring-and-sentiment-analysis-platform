import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/request-auth"
import { getAppointments, saveAppointment } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const appointments = await getAppointments(auth.user.id)
    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Appointment fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch appointments." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const appointment = await request.json()
    await saveAppointment(auth.user.id, appointment)
    const appointments = await getAppointments(auth.user.id)
    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Appointment save error:", error)
    return NextResponse.json({ error: "Failed to save appointment." }, { status: 500 })
  }
}
