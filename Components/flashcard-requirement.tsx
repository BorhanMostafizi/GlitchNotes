"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, BookOpen } from "lucide-react"

interface Flashcard {
  id: string
  front: string
  back: string
  category: string
}

interface FlashcardRequirementProps {
  onFlashcardsReady: (flashcards: Flashcard[]) => void
  onCancel: () => void
}

export default function FlashcardRequirement({ onFlashcardsReady, onCancel }: FlashcardRequirementProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [newCard, setNewCard] = useState({ front: "", back: "", category: "" })

  const addFlashcard = () => {
    if (newCard.front.trim() && newCard.back.trim()) {
      const card: Flashcard = {
        id: Date.now().toString(),
        front: newCard.front.trim(),
        back: newCard.back.trim(),
        category: newCard.category.trim() || "General",
      }
      setFlashcards([...flashcards, card])
      setNewCard({ front: "", back: "", category: "" })
    }
  }

  const deleteFlashcard = (id: string) => {
    setFlashcards(flashcards.filter((card) => card.id !== id))
  }

  const canProceed = flashcards.length >= 10

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center">
              <BookOpen className="h-6 w-6 mr-2" />
              Create Flashcards for Game Questions
            </CardTitle>
            <p className="text-white/80">
              You need at least 10 flashcards to create a game. These will be used as questions during gameplay.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(flashcards.length / 10) * 100} className="h-3" />
              <div className="text-white text-center mt-2">
                {flashcards.length}/10 flashcards created
                {canProceed && " ✅ Ready to create game!"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Flashcard */}
        <Card className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Add New Flashcard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Question (front of card)"
              value={newCard.front}
              onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <Textarea
              placeholder="Answer (back of card)"
              value={newCard.back}
              onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <Input
              placeholder="Category (optional)"
              value={newCard.category}
              onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <Button
              onClick={addFlashcard}
              className="w-full bg-green-500 hover:bg-green-600"
              disabled={!newCard.front.trim() || !newCard.back.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </CardContent>
        </Card>

        {/* Existing Flashcards */}
        <Card className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Your Flashcards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {flashcards.map((card, index) => (
                <div key={card.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">
                        {index + 1}. {card.front}
                      </div>
                      <div className="text-white/70 mb-2">{card.back}</div>
                      <div className="text-xs text-white/50">Category: {card.category}</div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => deleteFlashcard(card.id)} className="ml-4">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {flashcards.length === 0 && (
                <div className="text-center text-white/60 py-8">
                  No flashcards created yet. Add your first flashcard above!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-red-500/20 border-red-400 text-white hover:bg-red-500/30"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onFlashcardsReady(flashcards)}
            disabled={!canProceed}
            className={`
              px-8 py-3 text-lg font-bold
              ${
                canProceed
                  ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  : "bg-gray-500 text-gray-300 cursor-not-allowed"
              }
            `}
          >
            {canProceed ? "Create Game with These Flashcards!" : `Need ${10 - flashcards.length} more flashcards`}
          </Button>
        </div>
      </div>
    </div>
  )
}
