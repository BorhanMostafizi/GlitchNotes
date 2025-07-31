"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, Timer, Target, Zap } from "lucide-react"

interface LockedModeProps {
  onUnlock: () => void
}

export default function LockedMode({ onUnlock }: LockedModeProps) {
  const [unlockMethod, setUnlockMethod] = useState<"wait" | "challenge" | "emergency">("wait")
  const [waitTime, setWaitTime] = useState(300) // 5 minutes default
  const [challengeAnswer, setChallengeAnswer] = useState("")
  const [currentChallenge, setCurrentChallenge] = useState<{
    question: string
    answer: string
  } | null>(null)
  const [emergencyCode, setEmergencyCode] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const challenges = [
    { question: "What is 15 × 8?", answer: "120" },
    { question: "What is the capital of Japan?", answer: "tokyo" },
    { question: "What is 144 ÷ 12?", answer: "12" },
    { question: "What year did World War II end?", answer: "1945" },
    { question: "What is the square root of 64?", answer: "8" },
    { question: "What is 25% of 200?", answer: "50" },
    { question: "What is the largest planet in our solar system?", answer: "jupiter" },
    { question: "What is 7 × 9?", answer: "63" },
    { question: "What is the chemical symbol for gold?", answer: "au" },
    { question: "How many sides does a hexagon have?", answer: "6" },
  ]

  useEffect(() => {
    // Generate random challenge
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
    setCurrentChallenge(randomChallenge)

    // Generate emergency code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setEmergencyCode(code)
    console.log("Emergency unlock code:", code) // In real app, this would be sent via email/SMS
  }, [])

  useEffect(() => {
    if (unlockMethod === "wait" && waitTime > 0) {
      const interval = setInterval(() => {
        setWaitTime((prev) => {
          if (prev <= 1) {
            setIsUnlocking(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [unlockMethod, waitTime])

  const handleChallengeSubmit = () => {
    if (!currentChallenge) return

    const userAnswer = challengeAnswer.toLowerCase().trim()
    const correctAnswer = currentChallenge.answer.toLowerCase()

    if (userAnswer === correctAnswer) {
      setIsUnlocking(true)
      setTimeout(onUnlock, 1000)
    } else {
      setAttempts((prev) => prev + 1)
      setChallengeAnswer("")

      if (attempts >= 2) {
        // Generate new challenge after 3 failed attempts
        const newChallenge = challenges[Math.floor(Math.random() * challenges.length)]
        setCurrentChallenge(newChallenge)
        setAttempts(0)
      }
    }
  }

  const handleEmergencyUnlock = () => {
    // In a real app, this would verify the code sent to user's email/phone
    setIsUnlocking(true)
    setTimeout(onUnlock, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isUnlocking) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur">
          <CardContent className="text-center p-8">
            <div className="animate-bounce mb-4">
              <Unlock className="h-16 w-16 mx-auto text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Unlocking...</h2>
            <p className="text-green-600">Welcome back! Great job staying focused.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Lock className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">Editor Locked</CardTitle>
          <p className="text-red-600">The editor has been locked due to inactivity. Choose how to unlock:</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unlock Methods */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={unlockMethod === "wait" ? "default" : "outline"}
              size="sm"
              onClick={() => setUnlockMethod("wait")}
              className="flex flex-col h-16"
            >
              <Timer className="h-4 w-4 mb-1" />
              <span className="text-xs">Wait</span>
            </Button>
            <Button
              variant={unlockMethod === "challenge" ? "default" : "outline"}
              size="sm"
              onClick={() => setUnlockMethod("challenge")}
              className="flex flex-col h-16"
            >
              <Target className="h-4 w-4 mb-1" />
              <span className="text-xs">Challenge</span>
            </Button>
            <Button
              variant={unlockMethod === "emergency" ? "default" : "outline"}
              size="sm"
              onClick={() => setUnlockMethod("emergency")}
              className="flex flex-col h-16"
            >
              <Zap className="h-4 w-4 mb-1" />
              <span className="text-xs">Emergency</span>
            </Button>
          </div>

          {/* Wait Method */}
          {unlockMethod === "wait" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-mono font-bold text-blue-600 mb-2">{formatTime(waitTime)}</div>
                <p className="text-sm text-blue-700 mb-4">
                  Wait for the timer to complete. Use this time to reflect on your goals.
                </p>
                {waitTime === 0 && (
                  <Button onClick={onUnlock} className="w-full">
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Now
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Challenge Method */}
          {unlockMethod === "challenge" && currentChallenge && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <Badge variant="outline" className="mb-2">
                    Question {attempts + 1}/3
                  </Badge>
                  <p className="font-medium text-yellow-800 mb-4">{currentChallenge.question}</p>
                  <Input
                    value={challengeAnswer}
                    onChange={(e) => setChallengeAnswer(e.target.value)}
                    placeholder="Your answer..."
                    onKeyPress={(e) => e.key === "Enter" && handleChallengeSubmit()}
                    className="mb-4"
                  />
                  <Button onClick={handleChallengeSubmit} className="w-full">
                    Submit Answer
                  </Button>
                </div>
                {attempts > 0 && (
                  <p className="text-xs text-yellow-600 text-center">
                    {attempts} incorrect attempt{attempts > 1 ? "s" : ""}.
                    {attempts >= 2 ? " New question generated." : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Emergency Method */}
          {unlockMethod === "emergency" && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-red-700 mb-4">
                    Emergency unlock bypasses the focus lock. Use only when absolutely necessary.
                  </p>
                  <p className="text-xs text-red-600 mb-4">
                    In a real app, you would receive the unlock code via email or SMS.
                    <br />
                    <strong>Demo code: {emergencyCode}</strong>
                  </p>
                  <Button onClick={handleEmergencyUnlock} variant="destructive" className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Emergency Unlock
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Motivational Message */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">
                💡 <strong>Remember:</strong> This lock helps you build focus and resist distractions. The discomfort
                you feel is your brain learning to concentrate better.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
