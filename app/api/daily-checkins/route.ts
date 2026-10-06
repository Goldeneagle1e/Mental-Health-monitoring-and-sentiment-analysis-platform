import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/request-auth"
import { getDailyCheckins, saveDailyCheckin, updateDailyCheckin } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const dailyCheckins = await getDailyCheckins(auth.user.id)
    return NextResponse.json({ dailyCheckins })
  } catch (error) {
    console.error("Checkin fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch daily check-ins." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const checkin = await request.json()
    await saveDailyCheckin(auth.user.id, checkin)
    const dailyCheckins = await getDailyCheckins(auth.user.id)
    return NextResponse.json({ dailyCheckins })
  } catch (error) {
    console.error("Checkin save error:", error)
    return NextResponse.json({ error: "Failed to save daily check-in." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const { id, ...update } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Check-in id is required." }, { status: 400 })
    }

    await updateDailyCheckin(auth.user.id, id, update)
    const dailyCheckins = await getDailyCheckins(auth.user.id)
    return NextResponse.json({ dailyCheckins })
  } catch (error) {
    console.error("Checkin update error:", error)
    return NextResponse.json({ error: "Failed to update daily check-in." }, { status: 500 })
  }
}
