"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Zap } from "lucide-react"

interface InactivityMonitorProps {
  onInactivityDetected: () => void
  isLocked: boolean
}

export default function InactivityMonitor({ onInactivityDetected, isLocked }: InactivityMonitorProps) {
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [inactiveTime, setInactiveTime] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningCountdown, setWarningCountdown] = useState(30)

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now())
      setInactiveTime(0)
      setShowWarning(false)
      setWarningCountdown(30)
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [])

  useEffect(() => {
    if (isLocked) return

    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = Math.floor((now - lastActivity) / 1000)
      setInactiveTime(timeSinceLastActivity)

      // Show warning at 4.5 minutes (270 seconds)
      if (timeSinceLastActivity >= 270 && !showWarning) {
        setShowWarning(true)
        setWarningCountdown(30)
      }

      // Update countdown
      if (showWarning && timeSinceLastActivity < 300) {
        const remaining = 300 - timeSinceLastActivity
        setWarningCountdown(remaining)
      }

      // Trigger lock at 5 minutes (300 seconds)
      if (timeSinceLastActivity >= 300) {
        onInactivityDetected()
        setShowWarning(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastActivity, isLocked, showWarning, onInactivityDetected])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLocked) return null

  return (
    <>
      {/* Activity Status Badge */}
      <div className="fixed top-4 right-4 z-40">
        <Badge variant={inactiveTime > 240 ? "destructive" : inactiveTime > 180 ? "secondary" : "outline"}>
          <Clock className="h-3 w-3 mr-1" />
          Inactive: {formatTime(inactiveTime)}
        </Badge>
      </div>

      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-orange-500 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Inactivity Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{warningCountdown}</div>
                <p className="text-orange-700">
                  You've been inactive for over 4 minutes. The editor will lock in {warningCountdown} seconds to help
                  you stay focused.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-orange-600">
                <Zap className="h-4 w-4" />
                <span>Move your mouse or press any key to continue</span>
              </div>

              <Button
                onClick={() => {
                  setLastActivity(Date.now())
                  setInactiveTime(0)
                  setShowWarning(false)
                }}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                I'm Still Here!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
