import { NextRequest, NextResponse } from "next/server"
import { createEmailVerification, generateVerificationCode, hashPassword, sanitizeUser, sendVerificationEmail } from "@/lib/server/auth"
import { createUser, findUserByEmail } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Valid email and a password of at least 8 characters are required." }, { status: 400 })
    }

    if (role && role !== "patient" && role !== "therapist") {
      return NextResponse.json({ error: "Role must be patient or therapist." }, { status: 400 })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser(email, passwordHash, role || "patient")
    const code = generateVerificationCode()
    await createEmailVerification(user.id, code)
    const delivery = await sendVerificationEmail(user.email, code)

    return NextResponse.json({
      message: delivery.message,
      emailDelivery: delivery,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 })
  }
}
