import { NextResponse } from "next/server"
import { getBearerToken, verifyToken } from "@/lib/server/auth"
import { findUserById } from "@/lib/server/user-store"

export async function requireAuth(request: Request) {
  const token = getBearerToken(request)
  if (!token) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) }
  }

  try {
    const payload = await verifyToken(token)
    const user = await findUserById(payload.userId)

    if (!user) {
      return { error: NextResponse.json({ error: "User not found." }, { status: 404 }) }
    }

    return { user, tokenPayload: payload }
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired token." }, { status: 401 }) }
  }
}
