"use client"

import { useState, useEffect } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Textarea } from "@/Components/ui/textarea"
import { Progress } from "@/Components/ui/progress"
import { Badge } from "@/Components/ui/badge"
import { Brain, Clock, Lightbulb, RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  concept: string
  explanation: string
  lastReviewed: Date
  nextReview: Date
  reviewCount: number
  difficulty: 1 | 2 | 3 | 4 | 5 // 1 = easy, 5 = hard
  mastery: number // 0-100%
  createdAt: Date
}

interface ReviewSession {
  noteId: string
  timestamp: Date
  success: boolean
  responseTime: number
}

// Ebbinghaus curve intervals (in hours)
const REVIEW_INTERVALS = [1, 4, 24, 72, 168, 336, 720, 1440] // 1h, 4h, 1d, 3d, 1w, 2w, 1m, 2m

export default function ForgetMeNotSystem() {
  const [notes, setNotes] = useState<Note[]>([])
  const [reviewSessions, setReviewSessions] = useState<ReviewSession[]>([])
  const [currentReview, setCurrentReview] = useState<Note | null>(null)
  const [reviewMode, setReviewMode] = useState<"recall" | "feynman" | null>(null)
  const [userResponse, setUserResponse] = useState("")
  const [timeLeft, setTimeLeft] = useState(3)
  const [showAnswer, setShowAnswer] = useState(false)
  const [newNote, setNewNote] = useState({
    title: "",
    concept: "",
    explanation: "",
  })

  // Load data from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("forget-me-not-notes")
    const savedSessions = localStorage.getItem("forget-me-not-sessions")

    if (savedNotes) {
      setNotes(
        JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          lastReviewed: new Date(note.lastReviewed),
          nextReview: new Date(note.nextReview),
          createdAt: new Date(note.createdAt),
        })),
      )
    }
    if (savedSessions) {
      setReviewSessions(
        JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
        })),
      )
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("forget-me-not-notes", JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem("forget-me-not-sessions", JSON.stringify(reviewSessions))
  }, [reviewSessions])

  // Check for due reviews every minute
  useEffect(() => {
    const checkReviews = () => {
      const now = new Date()
      const dueNotes = notes.filter((note) => note.nextReview <= now)

      if (dueNotes.length > 0 && !currentReview) {
        // Trigger a review
        const randomNote = dueNotes[Math.floor(Math.random() * dueNotes.length)]
        startReview(randomNote)
      }
    }

    const interval = setInterval(checkReviews, 60000) // Check every minute
    checkReviews() // Check immediately

    return () => clearInterval(interval)
  }, [notes, currentReview])

  // Timer for recall challenges
  useEffect(() => {
    if (currentReview && reviewMode === "recall" && timeLeft > 0 && !showAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showAnswer) {
      setShowAnswer(true)
    }
  }, [currentReview, reviewMode, timeLeft, showAnswer])

  const addNote = () => {
    if (!newNote.title.trim() || !newNote.concept.trim() || !newNote.explanation.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: `${newNote.concept}\n\n${newNote.explanation}`,
      concept: newNote.concept,
      explanation: newNote.explanation,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + REVIEW_INTERVALS[0] * 60 * 60 * 1000), // 1 hour
      reviewCount: 0,
      difficulty: 3,
      mastery: 0,
      createdAt: new Date(),
    }

    setNotes((prev) => [...prev, note])
    setNewNote({ title: "", concept: "", explanation: "" })
  }

  const startReview = (note: Note) => {
    setCurrentReview(note)
    setReviewMode(Math.random() < 0.7 ? "recall" : "feynman") // 70% recall, 30% Feynman
    setUserResponse("")
    setTimeLeft(3)
    setShowAnswer(false)
  }

  const completeReview = (success: boolean, responseTime = 3000) => {
    if (!currentReview) return

    // Record the session
    const session: ReviewSession = {
      noteId: currentReview.id,
      timestamp: new Date(),
      success,
      responseTime,
    }
    setReviewSessions((prev) => [...prev, session])

    // Update note based on performance
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === currentReview.id) {
          const newReviewCount = note.reviewCount + 1
          let newDifficulty = note.difficulty
          let masteryChange = 0

          if (success) {
            newDifficulty = Math.max(1, note.difficulty - 1)
            masteryChange = responseTime < 2000 ? 20 : 10 // Faster response = more mastery
          } else {
            newDifficulty = Math.min(5, note.difficulty + 1)
            masteryChange = -15
          }

          const newMastery = Math.max(0, Math.min(100, note.mastery + masteryChange))

          // Calculate next review interval based on difficulty and mastery
          const baseInterval = REVIEW_INTERVALS[Math.min(newReviewCount, REVIEW_INTERVALS.length - 1)]
          const difficultyMultiplier = success ? (6 - newDifficulty) / 3 : 0.5
          const masteryMultiplier = 1 + newMastery / 200 // 0.5x to 1.5x based on mastery

          const nextReviewHours = baseInterval * difficultyMultiplier * masteryMultiplier
          const nextReview = new Date(Date.now() + nextReviewHours * 60 * 60 * 1000)

          return {
            ...note,
            lastReviewed: new Date(),
            nextReview,
            reviewCount: newReviewCount,
            difficulty: newDifficulty,
            mastery: newMastery,
          }
        }
        return note
      }),
    )

    // Clear current review
    setCurrentReview(null)
    setReviewMode(null)
    setUserResponse("")
  }

  const updateExplanation = () => {
    if (!currentReview || !userResponse.trim()) return

    setNotes((prev) =>
      prev.map((note) =>
        note.id === currentReview.id
          ? { ...note, explanation: userResponse, content: `${note.concept}\n\n${userResponse}` }
          : note,
      ),
    )

    completeReview(true, 3000 - timeLeft * 1000)
  }

  const getDueNotes = () => {
    const now = new Date()
    return notes.filter((note) => note.nextReview <= now)
  }

  const getUpcomingNotes = () => {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return notes.filter((note) => note.nextReview > now && note.nextReview <= in24Hours)
  }

  const formatTimeUntilReview = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return "Due now"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-green-600"
    if (mastery >= 60) return "text-blue-600"
    if (mastery >= 40) return "text-yellow-600"
    if (mastery >= 20) return "text-orange-600"
    return "text-red-600"
  }

  // Review popup
  if (currentReview && reviewMode) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                {reviewMode === "recall" ? "Quick Recall Challenge" : "Feynman Technique Review"}
              </span>
              {reviewMode === "recall" && !showAnswer && (
                <Badge variant="destructive" className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft}s
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-2">{currentReview.title}</h3>
              <p className="text-blue-700">{currentReview.concept}</p>
            </div>

            {reviewMode === "recall" ? (
              <div>
                <p className="text-lg font-medium mb-4">Do you still remember this concept?</p>

                {!showAnswer ? (
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-300 mb-4">{timeLeft}</div>
                    <p className="text-gray-600">Think about your answer...</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-2">Your Previous Explanation:</h4>
                      <p className="text-gray-700">{currentReview.explanation}</p>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        onClick={() => completeReview(true, 3000 - timeLeft * 1000)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />I Remembered!
                      </Button>
                      <Button onClick={() => completeReview(false, 3000)} variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />I Forgot
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Your Previous Explanation:</h4>
                  <p className="text-gray-700">{currentReview.explanation}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Can you explain this concept better or more simply?
                    </label>
                    <Textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Re-write or simplify your explanation..."
                      className="min-h-32"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button onClick={updateExplanation} className="flex-1">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Update Explanation
                    </Button>
                    <Button onClick={() => completeReview(true, 3000)} variant="outline" className="flex-1">
                      Keep Original
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Brain className="h-6 w-6 mr-2" />
          Forget-Me-Not System
        </h2>
        <p className="text-gray-600">
          Spaced repetition system based on the Ebbinghaus forgetting curve. Add concepts and get reminded at optimal
          intervals.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold">{notes.length}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due Now</p>
                <p className="text-2xl font-bold text-red-600">{getDueNotes().length}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-yellow-600">{getUpcomingNotes().length}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Mastery</p>
                <p className="text-2xl font-bold text-green-600">
                  {notes.length > 0 ? Math.round(notes.reduce((sum, note) => sum + note.mastery, 0) / notes.length) : 0}
                  %
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Note */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Concept</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Input
              placeholder="Concept (what you want to remember)"
              value={newNote.concept}
              onChange={(e) => setNewNote((prev) => ({ ...prev, concept: e.target.value }))}
            />
            <Textarea
              placeholder="Your explanation (use the Feynman technique - explain it simply)"
              value={newNote.explanation}
              onChange={(e) => setNewNote((prev) => ({ ...prev, explanation: e.target.value }))}
              className="min-h-32"
            />
            <Button onClick={addNote} className="w-full">
              Add to Memory System
            </Button>
          </CardContent>
        </Card>

        {/* Notes List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Memory Bank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{note.title}</h4>
                    <Badge variant={note.nextReview <= new Date() ? "destructive" : "outline"}>
                      {formatTimeUntilReview(note.nextReview)}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{note.concept}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <span>Reviews: {note.reviewCount}</span>
                      <span>Difficulty: {"★".repeat(note.difficulty)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getMasteryColor(note.mastery)}`}>{note.mastery}% mastery</span>
                      <Button size="sm" variant="outline" onClick={() => startReview(note)}>
                        Review Now
                      </Button>
                    </div>
                  </div>

                  <Progress value={note.mastery} className="mt-2 h-1" />
                </div>
              ))}

              {notes.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No concepts added yet. Add your first concept to start building your memory bank!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
