import { NextRequest, NextResponse } from "next/server"
import { verifyEmailCode } from "@/lib/server/auth"
import { findUserByEmail } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    const valid = await verifyEmailCode(user.id, code)
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 })
    }

    return NextResponse.json({ message: "Email verified successfully." })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ error: "Failed to verify email." }, { status: 500 })
  }
}
