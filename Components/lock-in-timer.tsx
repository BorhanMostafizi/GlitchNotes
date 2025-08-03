"use client"

import { useState, useEffect } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Input } from "@/Components/ui/input"
import { Play, Pause, RotateCcw, Timer, Target, Zap } from "lucide-react"

interface LockInTimerProps {
  onTimerComplete: () => void
  isActive: boolean
}

export default function LockInTimer({ onTimerComplete, isActive }: LockInTimerProps) {
  const [duration, setDuration] = useState(25) // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [totalFocusTime, setTotalFocusTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            setSessions((s) => s + 1)
            setTotalFocusTime((t) => t + duration)
            onTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, duration, onTimerComplete])

  const startTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration * 60)
    }
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(duration * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Timer className="h-5 w-5 mr-2" />
            Lock-In Timer
          </span>
          <Badge variant="outline">
            <Target className="h-3 w-3 mr-1" />
            {sessions} sessions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ${
                  isRunning ? "text-blue-500" : timeLeft === 0 ? "text-green-500" : "text-gray-400"
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-500">
                  {isRunning ? "Focus Time" : timeLeft === 0 ? "Complete!" : "Ready"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Duration Setting */}
        {!isRunning && timeLeft === duration * 60 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (minutes)</label>
            <Input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => {
                const newDuration = Number.parseInt(e.target.value) || 25
                setDuration(newDuration)
                setTimeLeft(newDuration * 60)
              }}
              className="text-center"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <Button onClick={startTimer} className="flex items-center">
              <Play className="h-4 w-4 mr-2" />
              {timeLeft === duration * 60 ? "Start" : "Resume"}
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" className="flex items-center bg-transparent">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={resetTimer} variant="outline" className="flex items-center bg-transparent">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sessions}</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalFocusTime}m</div>
            <div className="text-sm text-gray-500">Total Focus</div>
          </div>
        </div>

        {/* Motivational Message */}
        {isRunning && (
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium text-blue-800">You're in the zone!</span>
            </div>
            <p className="text-xs text-blue-600">Stay focused and avoid distractions</p>
          </div>
        )}

        {/* Completion Message */}
        {timeLeft === 0 && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-800 mb-1">🎉 Session Complete!</div>
            <p className="text-sm text-green-600">Great job staying focused for {duration} minutes!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
