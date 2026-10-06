"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { enableTwoFactor, setupTwoFactor } from "@/lib/client/auth-client"
import type { UserProfile } from "@/lib/user-profile"
import { setActiveUser } from "@/lib/user-profile"

interface TwoFactorSettingsProps {
  user: UserProfile
  onUserUpdate: (profile: UserProfile) => void
}

export default function TwoFactorSettings({ user, onUserUpdate }: TwoFactorSettingsProps) {
  const [setupData, setSetupData] = useState<{ secret: string; otpAuthUrl: string; qrDataUrl: string } | null>(null)
  const [otp, setOtp] = useState("")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSetup() {
    setIsLoading(true)
    setStatus("")
    try {
      const response = await setupTwoFactor()
      setSetupData(response)
      setStatus("Scan the QR code in your authenticator app, then confirm with a 6-digit code.")
    } catch (err: any) {
      setStatus(err.message || "Unable to start 2FA setup.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEnable() {
    setIsLoading(true)
    setStatus("")
    try {
      await enableTwoFactor(otp)
      const nextUser = {
        ...user,
        twoFactorEnabled: true,
      }
      setActiveUser(nextUser)
      onUserUpdate(nextUser)
      setStatus("Two-factor authentication is now enabled for this account.")
    } catch (err: any) {
      setStatus(err.message || "Unable to enable 2FA.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Enable two-factor authentication for returning users who want stronger sign-in protection.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.twoFactorEnabled ? (
          <Alert>
            <AlertDescription>Two-factor authentication is enabled for this account.</AlertDescription>
          </Alert>
        ) : (
          <>
            <Button onClick={handleSetup} disabled={isLoading}>
              {isLoading ? "Preparing..." : "Set up 2FA"}
            </Button>

            {setupData && (
              <div className="space-y-4 rounded-lg border p-4">
                <img src={setupData.qrDataUrl} alt="2FA QR code" className="h-48 w-48 rounded-lg border bg-white p-2" />
                <p className="text-xs text-muted-foreground break-all">{setupData.otpAuthUrl}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Confirm authenticator code</p>
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
                  <Button onClick={handleEnable} disabled={isLoading || otp.length !== 6}>
                    Enable 2FA
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {status && (
          <Alert>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
