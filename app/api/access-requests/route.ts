import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/request-auth"
import { createAccessRequest, decideAccessRequest, findUserByEmail, getIncomingRequests } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const { patientEmail, requestType, platform, note } = await request.json()

    if (auth.user.role !== "therapist") {
      return NextResponse.json({ error: "Only therapists can send access requests." }, { status: 403 })
    }

    const patient = await findUserByEmail(patientEmail)
    if (!patient || patient.role !== "patient") {
      return NextResponse.json({ error: "No patient account was found for that email." }, { status: 404 })
    }

    if (requestType !== "care_link" && requestType !== "social_access") {
      return NextResponse.json({ error: "Unsupported request type." }, { status: 400 })
    }

    if (requestType === "social_access" && !platform) {
      return NextResponse.json({ error: "Platform is required for social access requests." }, { status: 400 })
    }

    await createAccessRequest({
      therapistId: auth.user.id,
      patientId: patient.id,
      requestType,
      platform,
      note,
    })

    return NextResponse.json({ message: "Request sent to patient inbox." })
  } catch (error) {
    console.error("Access request create error:", error)
    return NextResponse.json({ error: "Failed to create access request." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const { requestId, decision } = await request.json()

    if (auth.user.role !== "patient") {
      return NextResponse.json({ error: "Only patients can respond to access requests." }, { status: 403 })
    }

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json({ error: "Decision must be approved or rejected." }, { status: 400 })
    }

    const updated = await decideAccessRequest({
      requestId,
      patientId: auth.user.id,
      decision,
    })

    if (!updated) {
      return NextResponse.json({ error: "Request not found or already handled." }, { status: 404 })
    }

    const notifications = await getIncomingRequests(auth.user.id)
    return NextResponse.json({ message: `Request ${decision}.`, notifications })
  } catch (error) {
    console.error("Access request decision error:", error)
    return NextResponse.json({ error: "Failed to respond to request." }, { status: 500 })
  }
}
