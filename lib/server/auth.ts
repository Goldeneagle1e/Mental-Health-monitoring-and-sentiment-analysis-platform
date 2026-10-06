import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import { SignJWT, jwtVerify } from "jose"
import QRCode from "qrcode"
import speakeasy from "speakeasy"
import { dbQuery } from "@/lib/server/db"

const textEncoder = new TextEncoder()
const APP_SECRET = process.env.APP_SECRET || "dev-only-secret-change-me"

export interface SafeUser {
  id: string
  email: string
  role: "patient" | "therapist"
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export async function hashCode(code: string) {
  return bcrypt.hash(code, 8)
}

export async function verifyCode(code: string, codeHash: string) {
  return bcrypt.compare(code, codeHash)
}

export function generateVerificationCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`
}

export function sanitizeUser(user: {
  id: string
  email: string
  role: "patient" | "therapist"
  email_verified: boolean
  two_factor_enabled: boolean
  created_at: Date | string
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.email_verified),
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    createdAt: typeof user.created_at === "string" ? user.created_at : user.created_at.toISOString(),
  }
}

export async function signAccessToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(textEncoder.encode(APP_SECRET))
}

export async function signTwoFactorChallenge(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(textEncoder.encode(APP_SECRET))
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, textEncoder.encode(APP_SECRET))
  return payload as { userId: string; email: string; exp: number }
}

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.replace("Bearer ", "")
}

async function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendVerificationEmail(email: string, code: string) {
  const transporter = await createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com"

  if (!transporter) {
    return {
      delivered: false,
      previewCode: code,
      message: "SMTP is not configured. Use the preview verification code returned by the API for local development.",
    }
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your Mental Health Analysis account",
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
  })

  return {
    delivered: true,
    message: "Verification email sent successfully.",
  }
}

export async function createEmailVerification(userId: string, code: string) {
  const codeHash = await hashCode(code)
  await dbQuery(
    `
      INSERT INTO email_verifications (user_id, code_hash, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
    `,
    [userId, codeHash],
  )
}

export async function verifyEmailCode(userId: string, code: string) {
  const result = await dbQuery<{
    id: string
    code_hash: string
    expires_at: Date
    consumed_at: Date | null
  }>(
    `
      SELECT id, code_hash, expires_at, consumed_at
      FROM email_verifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId],
  )

  const verification = result.rows[0]
  if (!verification) return false
  if (verification.consumed_at) return false
  if (verification.expires_at.getTime() < Date.now()) return false

  const matches = await verifyCode(code, verification.code_hash)
  if (!matches) return false

  await dbQuery(`UPDATE email_verifications SET consumed_at = NOW() WHERE id = $1`, [verification.id])
  await dbQuery(`UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`, [userId])
  return true
}

export function generateTotpSecret(email: string) {
  return speakeasy.generateSecret({
    name: email,
    issuer: process.env.TOTP_APP_NAME || "Mental Health Analysis",
  }).base32
}

export async function buildTotpQrDataUrl(email: string, secret: string) {
  const appName = process.env.TOTP_APP_NAME || "Mental Health Analysis"
  const otpAuthUrl = speakeasy.otpauthURL({
    secret,
    label: email,
    issuer: appName,
    encoding: "base32",
  })
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl)
  return { otpAuthUrl, qrDataUrl }
}

export function verifyTotpToken(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    token,
    encoding: "base32",
    window: 1,
  })
}
