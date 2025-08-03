"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Textarea } from "@/Components/ui/textarea"
import { Badge } from "@/Components/ui/badge"
import { Progress } from "@/Components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { BookOpen, Plus, RotateCcw, Check, X, Shuffle, Download, Upload, Trash2, Edit } from "lucide-react"

interface Flashcard {
  id: string
  front: string
  back: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  lastReviewed: Date
  correctCount: number
  incorrectCount: number
}

export default function FlashcardSystem() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [studyProgress, setStudyProgress] = useState(0)
  const [studyCards, setStudyCards] = useState<Flashcard[]>([])
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 })

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [formData, setFormData] = useState({
    front: "",
    back: "",
    category: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  })
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    loadFlashcards()
  }, [])

  const loadFlashcards = () => {
    const saved = localStorage.getItem("flashcards")
    if (saved) {
      const cards = JSON.parse(saved).map((card: any) => ({
        ...card,
        lastReviewed: new Date(card.lastReviewed),
      }))
      setFlashcards(cards)
    }
  }

  const saveFlashcards = (cards: Flashcard[]) => {
    localStorage.setItem("flashcards", JSON.stringify(cards))
    setFlashcards(cards)
  }

  const addFlashcard = () => {
    if (!formData.front.trim() || !formData.back.trim()) return

    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: formData.front.trim(),
      back: formData.back.trim(),
      category: formData.category.trim() || "General",
      difficulty: formData.difficulty,
      lastReviewed: new Date(),
      correctCount: 0,
      incorrectCount: 0,
    }

    saveFlashcards([...flashcards, newCard])
    setFormData({ front: "", back: "", category: "", difficulty: "medium" })
    setShowForm(false)
  }

  const updateFlashcard = () => {
    if (!editingCard || !formData.front.trim() || !formData.back.trim()) return

    const updatedCards = flashcards.map((card) =>
      card.id === editingCard.id
        ? {
            ...card,
            front: formData.front.trim(),
            back: formData.back.trim(),
            category: formData.category.trim() || "General",
            difficulty: formData.difficulty,
          }
        : card,
    )

    saveFlashcards(updatedCards)
    setEditingCard(null)
    setFormData({ front: "", back: "", category: "", difficulty: "medium" })
  }

  const deleteFlashcard = (id: string) => {
    const updatedCards = flashcards.filter((card) => card.id !== id)
    saveFlashcards(updatedCards)
    if (currentCard?.id === id) {
      setCurrentCard(null)
    }
  }

  const startStudySession = () => {
    const cardsToStudy =
      filterCategory === "all" ? flashcards : flashcards.filter((card) => card.category === filterCategory)

    if (cardsToStudy.length === 0) return

    const shuffled = [...cardsToStudy].sort(() => Math.random() - 0.5)
    setStudyCards(shuffled)
    setCurrentStudyIndex(0)
    setStudyMode(true)
    setStudyProgress(0)
    setSessionStats({ correct: 0, incorrect: 0 })
    setCurrentCard(shuffled[0])
    setIsFlipped(false)
  }

  const handleAnswer = (correct: boolean) => {
    if (!currentCard) return

    // Update card stats
    const updatedCards = flashcards.map((card) =>
      card.id === currentCard.id
        ? {
            ...card,
            lastReviewed: new Date(),
            correctCount: correct ? card.correctCount + 1 : card.correctCount,
            incorrectCount: correct ? card.incorrectCount : card.incorrectCount + 1,
          }
        : card,
    )
    saveFlashcards(updatedCards)

    // Update session stats
    setSessionStats((prev) => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: correct ? prev.incorrect : prev.incorrect + 1,
    }))

    // Move to next card
    const nextIndex = currentStudyIndex + 1
    if (nextIndex < studyCards.length) {
      setCurrentStudyIndex(nextIndex)
      setCurrentCard(studyCards[nextIndex])
      setIsFlipped(false)
      setStudyProgress((nextIndex / studyCards.length) * 100)
    } else {
      // Session complete
      setStudyMode(false)
      setCurrentCard(null)
    }
  }

  const exportFlashcards = () => {
    const dataStr = JSON.stringify(flashcards, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "flashcards.json"
    link.click()
  }

  const importFlashcards = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          const validCards = imported
            .filter((card) => card.front && card.back && card.id)
            .map((card) => ({
              ...card,
              lastReviewed: new Date(card.lastReviewed || Date.now()),
            }))
          saveFlashcards([...flashcards, ...validCards])
        }
      } catch (error) {
        alert("Invalid file format")
      }
    }
    reader.readAsText(file)
  }

  const categories = Array.from(new Set(flashcards.map((card) => card.category)))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Flashcard System
          </span>
          <Badge variant="outline">{flashcards.length} cards</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!studyMode ? (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Card
              </Button>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={startStudySession} disabled={flashcards.length === 0} variant="default">
                <Shuffle className="h-4 w-4 mr-1" />
                Study
              </Button>

              <Button onClick={exportFlashcards} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>

              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input type="file" accept=".json" onChange={importFlashcards} className="hidden" />
              </label>
            </div>

            {/* Add/Edit Form */}
            {(showForm || editingCard) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Front</label>
                      <Textarea
                        value={formData.front}
                        onChange={(e) => setFormData((prev) => ({ ...prev, front: e.target.value }))}
                        placeholder="Question or prompt..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Back</label>
                      <Textarea
                        value={formData.back}
                        onChange={(e) => setFormData((prev) => ({ ...prev, back: e.target.value }))}
                        placeholder="Answer or explanation..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Math, History..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Difficulty</label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value: "easy" | "medium" | "hard") =>
                          setFormData((prev) => ({ ...prev, difficulty: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={editingCard ? updateFlashcard : addFlashcard}
                      disabled={!formData.front.trim() || !formData.back.trim()}
                    >
                      {editingCard ? "Update" : "Add"} Card
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditingCard(null)
                        setFormData({ front: "", back: "", category: "", difficulty: "medium" })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flashcard List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {flashcards
                .filter((card) => filterCategory === "all" || card.category === filterCategory)
                .map((card) => (
                  <Card key={card.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{card.front}</div>
                        <div className="text-xs text-gray-600 mb-2">{card.back}</div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {card.category}
                          </Badge>
                          <Badge
                            variant={
                              card.difficulty === "easy"
                                ? "secondary"
                                : card.difficulty === "medium"
                                  ? "default"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {card.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            ✓{card.correctCount} ✗{card.incorrectCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCard(card)
                            setFormData({
                              front: card.front,
                              back: card.back,
                              category: card.category,
                              difficulty: card.difficulty,
                            })
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteFlashcard(card.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>

            {flashcards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No flashcards yet. Create your first card to get started!</p>
              </div>
            )}
          </>
        ) : (
          /* Study Mode */
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Progress: {currentStudyIndex + 1} / {studyCards.length}
                </span>
                <span>
                  ✓{sessionStats.correct} ✗{sessionStats.incorrect}
                </span>
              </div>
              <Progress value={studyProgress} />
            </div>

            {currentCard ? (
              <div className="space-y-4">
                {/* Flashcard */}
                <Card
                  className={`flashcard cursor-pointer transition-all duration-300 min-h-48 ${
                    isFlipped ? "flipped" : ""
                  }`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <CardContent className="flashcard-inner p-6 flex items-center justify-center text-center min-h-48">
                    <div className="flashcard-front">
                      <div className="text-lg font-medium mb-4">{currentCard.front}</div>
                      <div className="text-sm text-gray-500">Click to reveal answer</div>
                    </div>
                    <div className="flashcard-back">
                      <div className="text-lg mb-4">{currentCard.back}</div>
                      <Badge variant="outline">{currentCard.category}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Answer Buttons */}
                {isFlipped && (
                  <div className="flex justify-center space-x-4">
                    <Button onClick={() => handleAnswer(false)} variant="outline" className="flex items-center">
                      <X className="h-4 w-4 mr-2" />
                      Incorrect
                    </Button>
                    <Button onClick={() => handleAnswer(true)} className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      Correct
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Session Complete */
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-xl font-bold mb-2">Session Complete!</div>
                <div className="text-gray-600 mb-4">
                  You got {sessionStats.correct} out of {sessionStats.correct + sessionStats.incorrect} correct
                </div>
                <div className="space-x-2">
                  <Button onClick={startStudySession}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Study Again
                  </Button>
                  <Button variant="outline" onClick={() => setStudyMode(false)}>
                    Back to Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
