"use client"

import { useState, useEffect } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Switch } from "@/Components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Bell, BellOff, Moon, Sun, VolumeX } from "lucide-react"

export default function DoNotDisturb() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [duration, setDuration] = useState("30") // minutes
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    // Load saved state
    const saved = localStorage.getItem("doNotDisturb")
    if (saved) {
      const data = JSON.parse(saved)
      if (data.endTime && new Date(data.endTime) > new Date()) {
        setIsEnabled(true)
        setEndTime(new Date(data.endTime))
        setDuration(data.duration || "30")
      }
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isEnabled && endTime) {
      interval = setInterval(() => {
        const now = new Date()
        const remaining = endTime.getTime() - now.getTime()

        if (remaining <= 0) {
          setIsEnabled(false)
          setEndTime(null)
          setTimeLeft("")
          localStorage.removeItem("doNotDisturb")
        } else {
          const minutes = Math.floor(remaining / (1000 * 60))
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isEnabled, endTime])

  const toggleDoNotDisturb = () => {
    if (isEnabled) {
      // Turn off
      setIsEnabled(false)
      setEndTime(null)
      setTimeLeft("")
      localStorage.removeItem("doNotDisturb")
    } else {
      // Turn on
      const durationMs = Number.parseInt(duration) * 60 * 1000
      const newEndTime = new Date(Date.now() + durationMs)

      setIsEnabled(true)
      setEndTime(newEndTime)

      // Save state
      localStorage.setItem(
        "doNotDisturb",
        JSON.stringify({
          endTime: newEndTime.toISOString(),
          duration,
        }),
      )

      // Request notification permission and show system notification
      if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Do Not Disturb Enabled", {
              body: `Focus mode active for ${duration} minutes`,
              icon: "/favicon.ico",
            })
          }
        })
      }
    }
  }

  // Apply do not disturb styles to document
  useEffect(() => {
    if (isEnabled) {
      document.body.classList.add("do-not-disturb")
      document.title = "🔕 Focus Mode - Anti-Procrastination Editor"
    } else {
      document.body.classList.remove("do-not-disturb")
      document.title = "Anti-Procrastination Editor"
    }

    return () => {
      document.body.classList.remove("do-not-disturb")
      document.title = "Anti-Procrastination Editor"
    }
  }, [isEnabled])

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card
        className={`transition-all duration-300 ${
          isEnabled ? "bg-purple-900 text-white border-purple-700" : "bg-white"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              {isEnabled ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              Do Not Disturb
            </span>
            {isEnabled && (
              <Badge variant="secondary" className="text-xs">
                {timeLeft}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {!isEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Duration</span>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15m</SelectItem>
                    <SelectItem value="30">30m</SelectItem>
                    <SelectItem value="60">1h</SelectItem>
                    <SelectItem value="120">2h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm">{isEnabled ? "Focus Mode" : "Enable Focus"}</span>
            <Switch checked={isEnabled} onCheckedChange={toggleDoNotDisturb} />
          </div>

          {isEnabled && (
            <div className="text-xs space-y-1 pt-2 border-t border-purple-700">
              <div className="flex items-center">
                <Moon className="h-3 w-3 mr-1" />
                <span>Notifications muted</span>
              </div>
              <div className="flex items-center">
                <VolumeX className="h-3 w-3 mr-1" />
                <span>Distractions minimized</span>
              </div>
              <div className="flex items-center">
                <Sun className="h-3 w-3 mr-1" />
                <span>Focus enhanced</span>
              </div>
            </div>
          )}

          {isEnabled && (
            <Button size="sm" variant="outline" onClick={toggleDoNotDisturb} className="w-full text-xs bg-transparent">
              End Focus Session
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
