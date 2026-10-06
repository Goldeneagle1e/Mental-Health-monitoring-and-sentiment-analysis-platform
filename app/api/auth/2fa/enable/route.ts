import { NextRequest, NextResponse } from "next/server"
import { verifyTotpToken } from "@/lib/server/auth"
import { requireAuth } from "@/lib/server/request-auth"
import { enableTwoFactor } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const { otp } = await request.json()

    if (!otp || !auth.user.two_factor_secret) {
      return NextResponse.json({ error: "OTP and a setup secret are required." }, { status: 400 })
    }

    const valid = verifyTotpToken(auth.user.two_factor_secret, otp)
    if (!valid) {
      return NextResponse.json({ error: "Invalid 2FA code." }, { status: 400 })
    }

    await enableTwoFactor(auth.user.id)
    return NextResponse.json({ message: "Two-factor authentication enabled successfully." })
  } catch (error) {
    console.error("2FA enable error:", error)
    return NextResponse.json({ error: "Failed to enable 2FA." }, { status: 500 })
  }
}
