import { NextRequest, NextResponse } from "next/server"
import { sanitizeUser, signAccessToken, signTwoFactorChallenge, verifyPassword } from "@/lib/server/auth"
import { findUserByEmail } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const matches = await verifyPassword(password, user.password_hash)
    if (!matches) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    if (!user.email_verified) {
      return NextResponse.json({ error: "Please verify your email before signing in.", requiresEmailVerification: true }, { status: 403 })
    }

    if (user.two_factor_enabled) {
      const challengeToken = await signTwoFactorChallenge({ userId: user.id, email: user.email })
      return NextResponse.json({
        requiresTwoFactor: true,
        challengeToken,
        user: sanitizeUser(user),
      })
    }

    const accessToken = await signAccessToken({ userId: user.id, email: user.email })
    return NextResponse.json({
      accessToken,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to sign in." }, { status: 500 })
  }
}
