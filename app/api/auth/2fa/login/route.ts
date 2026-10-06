import { NextRequest, NextResponse } from "next/server"
import { signAccessToken, verifyToken, verifyTotpToken } from "@/lib/server/auth"
import { findUserById } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { challengeToken, otp } = await request.json()

    if (!challengeToken || !otp) {
      return NextResponse.json({ error: "Challenge token and OTP are required." }, { status: 400 })
    }

    const payload = await verifyToken(challengeToken)
    const user = await findUserById(payload.userId)

    if (!user || !user.two_factor_secret) {
      return NextResponse.json({ error: "2FA setup is incomplete for this user." }, { status: 400 })
    }

    const valid = verifyTotpToken(user.two_factor_secret, otp)
    if (!valid) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 400 })
    }

    const accessToken = await signAccessToken({ userId: user.id, email: user.email })
    return NextResponse.json({ accessToken })
  } catch (error) {
    console.error("2FA login error:", error)
    return NextResponse.json({ error: "Failed to complete 2FA sign-in." }, { status: 500 })
  }
}
