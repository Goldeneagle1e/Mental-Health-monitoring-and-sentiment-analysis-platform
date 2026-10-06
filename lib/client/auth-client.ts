"use client"

import { getAccessToken, setAccessToken } from "@/lib/user-profile"

export async function apiFetch<T>(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAccessToken()
  const headers = new Headers(init.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || "Request failed")
  }

  return payload as T
}

export async function registerUser(email: string, password: string, role: "patient" | "therapist") {
  return apiFetch<{
    message: string
    emailDelivery: { delivered: boolean; previewCode?: string; message: string }
    user: { id: string; email: string; role: "patient" | "therapist"; emailVerified: boolean; twoFactorEnabled: boolean; createdAt: string }
  }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  })
}

export async function verifyRegistrationEmail(email: string, code: string) {
  return apiFetch<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  })
}

export async function loginUser(email: string, password: string) {
  return apiFetch<{
    accessToken?: string
    requiresTwoFactor?: boolean
    challengeToken?: string
    user?: {
      id: string
      email: string
      role: "patient" | "therapist"
      emailVerified: boolean
      twoFactorEnabled: boolean
      createdAt: string
    }
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function completeTwoFactorLogin(challengeToken: string, otp: string) {
  return apiFetch<{ accessToken: string }>("/api/auth/2fa/login", {
    method: "POST",
    body: JSON.stringify({ challengeToken, otp }),
  })
}

export async function fetchAuthenticatedProfile() {
  return apiFetch<{ user: any }>("/api/auth/me")
}

export function storeAccessToken(token: string) {
  setAccessToken(token)
}

export async function setupTwoFactor() {
  return apiFetch<{ secret: string; otpAuthUrl: string; qrDataUrl: string }>("/api/auth/2fa/setup", {
    method: "POST",
  })
}

export async function enableTwoFactor(otp: string) {
  return apiFetch<{ message: string }>("/api/auth/2fa/enable", {
    method: "POST",
    body: JSON.stringify({ otp }),
  })
}
