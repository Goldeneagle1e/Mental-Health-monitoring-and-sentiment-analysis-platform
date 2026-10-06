import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/request-auth"
import { upsertSocialConnection } from "@/lib/server/user-store"

const providerEnvMap = {
  twitter: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
  reddit: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"],
  instagram: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
} as const

function hasProviderCredentials(platform: keyof typeof providerEnvMap) {
  return providerEnvMap[platform].every((envName) => Boolean(process.env[envName]))
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const platform = body.platform as keyof typeof providerEnvMap
    const username = String(body.username || "").trim()
    const consent = Boolean(body.consent)

    if (!platform || !providerEnvMap[platform]) {
      return NextResponse.json({ error: "Supported platform is required." }, { status: 400 })
    }

    if (!username || !consent) {
      return NextResponse.json({ error: "Username and explicit consent are required." }, { status: 400 })
    }

    const providerConfigured = hasProviderCredentials(platform)
    const connection = {
      platform,
      username,
      status: "connected" as const,
      connectedAt: new Date().toISOString(),
      authMethod: providerConfigured ? "oauth" as const : "demo" as const,
    }

    await upsertSocialConnection(auth.user.id, connection)

    return NextResponse.json({
      message: providerConfigured
        ? `OAuth credentials for ${platform} are configured. This account is marked ready for provider authorization.`
        : `Provider credentials for ${platform} are not configured yet, so the app is using a clearly labeled demo connection for this account.`,
      connection,
    })
  } catch (error) {
    console.error("Social connect error:", error)
    return NextResponse.json({ error: "Unable to connect social account." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const platform = String(body.platform || "")

    if (platform) {
      await upsertSocialConnection(auth.user.id, {
        platform: platform as "twitter" | "reddit" | "instagram",
        status: "disconnected",
        authMethod: "demo",
        username: "",
      })
    }

    return NextResponse.json({
      message: platform ? `${platform} account disconnected.` : "Social account disconnected.",
    })
  } catch (error) {
    console.error("Social disconnect error:", error)
    return NextResponse.json({ error: "Unable to disconnect social account." }, { status: 500 })
  }
}
