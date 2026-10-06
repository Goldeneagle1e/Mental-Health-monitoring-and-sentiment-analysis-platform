"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { fetchAuthenticatedProfile, loginUser, registerUser, storeAccessToken, verifyRegistrationEmail, completeTwoFactorLogin } from "@/lib/client/auth-client"
import type { UserProfile, UserRole } from "@/lib/user-profile"
import { setActiveUser } from "@/lib/user-profile"

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void
}

type AuthStage = "credentials" | "verify-email" | "two-factor"

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<UserRole>("patient")
  const [stage, setStage] = useState<AuthStage>("credentials")
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [twoFactorChallengeToken, setTwoFactorChallengeToken] = useState("")

  async function completeAuthenticatedFlow(accessToken: string) {
    storeAccessToken(accessToken)
    const payload = await fetchAuthenticatedProfile()
    setActiveUser(payload.user)
    onLoginSuccess(payload.user)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setInfo("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }

      if (isSignUp) {
        const response = await registerUser(email, password, role)
        setPreviewCode(response.emailDelivery.previewCode || null)
        setInfo(response.emailDelivery.delivered ? response.message : `${response.message} Preview code: ${response.emailDelivery.previewCode}`)
        setStage("verify-email")
        return
      }

      const response = await loginUser(email, password)
      if (response.requiresTwoFactor && response.challengeToken) {
        setTwoFactorChallengeToken(response.challengeToken)
        setStage("two-factor")
        setInfo("Enter the 6-digit code from your authenticator app.")
        return
      }

      if (!response.accessToken) {
        throw new Error("No access token returned from the server.")
      }

      await completeAuthenticatedFlow(response.accessToken)
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setInfo("")
    setIsLoading(true)
    try {
      await verifyRegistrationEmail(email, verificationCode)
      setInfo("Email verified. You can sign in now.")
      setStage("credentials")
      setIsSignUp(false)
      setVerificationCode("")
    } catch (err: any) {
      setError(err.message || "Verification failed.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setInfo("")
    setIsLoading(true)
    try {
      const response = await completeTwoFactorLogin(twoFactorChallengeToken, otp)
      await completeAuthenticatedFlow(response.accessToken)
    } catch (err: any) {
      setError(err.message || "2FA verification failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/60 bg-white/85 shadow-xl shadow-sky-200/30 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-sky-950">Mental Health Analysis</CardTitle>
          <CardDescription>
            {stage === "verify-email"
              ? "Verify your email to activate the account"
              : stage === "two-factor"
                ? "Two-factor verification is enabled for this account"
                : isSignUp
                  ? "Create a patient or therapist account with email verification"
                  : "Sign in to continue your survey, support tools, and analysis history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === "credentials" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {info && (
                <Alert>
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="role">Portal type</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRole)}
                    className="h-10 w-full rounded-md border border-sky-200 bg-white px-3"
                    disabled={isLoading}
                  >
                    <option value="patient">Patient portal</option>
                    <option value="therapist">Therapist portal</option>
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full bg-sky-600 text-white hover:bg-sky-700" disabled={isLoading}>
                {isLoading ? "Please wait..." : isSignUp ? "Register" : "Sign In"}
              </Button>

              <div className="text-center text-sm">
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
                  {isSignUp ? "Already have an account? Sign in" : "Need an account? Register"}
                </button>
              </div>
            </form>
          )}

          {stage === "verify-email" && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert>
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="verification-email">Email</Label>
                <Input id="verification-email" value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="Enter the 6-digit code"
                  disabled={isLoading}
                />
              </div>
              {previewCode && (
                <Alert>
                  <AlertDescription>Local preview code: {previewCode}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          )}

          {stage === "two-factor" && (
            <form onSubmit={handleTwoFactor} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert>
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Authenticator code</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? "Checking..." : "Complete Sign In"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
