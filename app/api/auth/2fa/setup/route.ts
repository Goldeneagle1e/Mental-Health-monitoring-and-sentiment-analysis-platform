import { NextRequest, NextResponse } from "next/server"
import { buildTotpQrDataUrl, generateTotpSecret } from "@/lib/server/auth"
import { requireAuth } from "@/lib/server/request-auth"
import { setTwoFactorSecret } from "@/lib/server/user-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const secret = generateTotpSecret(auth.user.email)
    await setTwoFactorSecret(auth.user.id, secret)
    const setup = await buildTotpQrDataUrl(auth.user.email, secret)

    return NextResponse.json({
      secret,
      ...setup,
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json({ error: "Failed to setup 2FA." }, { status: 500 })
  }
}
