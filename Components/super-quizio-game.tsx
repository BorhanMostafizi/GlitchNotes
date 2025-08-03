"use client"

import { Badge } from "@/Components/ui/badge"
import { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Progress } from "@/Components/ui/progress"
import { Heart, Coins, Star } from "lucide-react"

interface Enemy {
  id: string
  name: string
  emoji: string
  question: {
    text: string
    options: string[]
    correct: number
  }
  defeated: boolean
}

interface Level {
  id: number
  name: string
  enemies: Enemy[]
  coins: number
  completed: boolean
}

const MARIO_LEVELS: Level[] = [
  {
    id: 1,
    name: "World 1-1: Green Hill",
    enemies: [
      {
        id: "goomba1",
        name: "Goomba",
        emoji: "🍄",
        question: { text: "What is 5 + 3?", options: ["6", "7", "8", "9"], correct: 2 },
        defeated: false,
      },
      {
        id: "koopa1",
        name: "Koopa Troopa",
        emoji: "🐢",
        question: { text: "What is 12 ÷ 4?", options: ["2", "3", "4", "5"], correct: 1 },
        defeated: false,
      },
    ],
    coins: 100,
    completed: false,
  },
  {
    id: 2,
    name: "World 1-2: Underground",
    enemies: [
      {
        id: "piranha1",
        name: "Piranha Plant",
        emoji: "🌱",
        question: { text: "What is the capital of Italy?", options: ["Milan", "Rome", "Naples", "Venice"], correct: 1 },
        defeated: false,
      },
      {
        id: "buzzy1",
        name: "Buzzy Beetle",
        emoji: "🪲",
        question: { text: "What is 7 × 6?", options: ["40", "41", "42", "43"], correct: 2 },
        defeated: false,
      },
      {
        id: "hammer1",
        name: "Hammer Bro",
        emoji: "🔨",
        question: { text: "What is 15²?", options: ["225", "235", "245", "255"], correct: 0 },
        defeated: false,
      },
    ],
    coins: 200,
    completed: false,
  },
  {
    id: 3,
    name: "World 1-3: Sky Level",
    enemies: [
      {
        id: "lakitu1",
        name: "Lakitu",
        emoji: "☁️",
        question: { text: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "CO2", "Helium"], correct: 2 },
        defeated: false,
      },
      {
        id: "spiny1",
        name: "Spiny",
        emoji: "🦔",
        question: { text: "What is 144 ÷ 12?", options: ["11", "12", "13", "14"], correct: 1 },
        defeated: false,
      },
    ],
    coins: 150,
    completed: false,
  },
  {
    id: 4,
    name: "World 1-4: Castle",
    enemies: [
      {
        id: "bowser1",
        name: "Bowser",
        emoji: "🐲",
        question: {
          text: "What is the largest ocean?",
          options: ["Atlantic", "Pacific", "Indian", "Arctic"],
          correct: 1,
        },
        defeated: false,
      },
    ],
    coins: 500,
    completed: false,
  },
]

export default function SuperQuizioGame() {
  const [player, setPlayer] = useState({
    hp: 100,
    coins: 0,
    currentLevel: 1,
    currentEnemyIndex: 0,
  })
  const [levels, setLevels] = useState<Level[]>(MARIO_LEVELS)
  const [gamePhase, setGamePhase] = useState<"playing" | "victory" | "defeat">("playing")

  const currentLevel = levels.find((l) => l.id === player.currentLevel)
  const currentEnemy = currentLevel?.enemies[player.currentEnemyIndex]

  const handleAnswer = (answerIndex: number) => {
    if (!currentEnemy || !currentLevel) return

    const isCorrect = answerIndex === currentEnemy.question.correct

    if (isCorrect) {
      // Defeat enemy
      const updatedLevels = levels.map((level) => {
        if (level.id === player.currentLevel) {
          const updatedEnemies = level.enemies.map((enemy) =>
            enemy.id === currentEnemy.id ? { ...enemy, defeated: true } : enemy,
          )
          return { ...level, enemies: updatedEnemies }
        }
        return level
      })
      setLevels(updatedLevels)

      // Add coins
      setPlayer((prev) => ({ ...prev, coins: prev.coins + 50 }))

      alert(`✅ Defeated ${currentEnemy.name}! +50 coins`)

      // Check if level is complete
      const allEnemiesDefeated = currentLevel.enemies.every((enemy, index) => {
        return index <= player.currentEnemyIndex || enemy.defeated
      })

      if (player.currentEnemyIndex >= currentLevel.enemies.length - 1) {
        // Level complete
        setPlayer((prev) => ({ ...prev, coins: prev.coins + currentLevel.coins }))
        alert(`🎉 Level ${player.currentLevel} complete! +${currentLevel.coins} bonus coins!`)

        if (player.currentLevel >= levels.length) {
          setGamePhase("victory")
        } else {
          setPlayer((prev) => ({ ...prev, currentLevel: prev.currentLevel + 1, currentEnemyIndex: 0 }))
        }
      } else {
        // Next enemy
        setPlayer((prev) => ({ ...prev, currentEnemyIndex: prev.currentEnemyIndex + 1 }))
      }
    } else {
      // Wrong answer - lose HP
      const newHp = Math.max(0, player.hp - 25)
      setPlayer((prev) => ({ ...prev, hp: newHp }))

      if (newHp <= 0) {
        setGamePhase("defeat")
        alert("💀 Game Over! You ran out of HP!")
      } else {
        alert(`❌ Wrong answer! -25 HP (${newHp}/100 remaining)`)
      }
    }
  }

  if (gamePhase === "victory") {
    return (
      <Card className="border-yellow-400">
        <CardContent className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">🏆 Victory!</h2>
          <p className="text-lg mb-4">You completed all levels!</p>
          <p className="mb-4">Final Score: {player.coins} coins</p>
          <Button onClick={() => window.location.reload()}>Play Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (gamePhase === "defeat") {
    return (
      <Card className="border-red-400">
        <CardContent className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">💀 Game Over!</h2>
          <p className="text-lg mb-4">You ran out of HP!</p>
          <p className="mb-4">Final Score: {player.coins} coins</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6">
      {/* Player Stats */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-1" />
                <span>{player.hp}/100</span>
              </div>
              <div className="flex items-center">
                <Coins className="h-5 w-5 text-yellow-500 mr-1" />
                <span>{player.coins}</span>
              </div>
            </div>
            <Badge variant="outline">Level {player.currentLevel}</Badge>
          </div>
          <Progress value={player.hp} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Level */}
      {currentLevel && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              {currentLevel.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="flex space-x-4">
                {currentLevel.enemies.map((enemy, index) => (
                  <div
                    key={enemy.id}
                    className={`
                      text-4xl p-2 rounded-lg border-2 transition-all
                      ${index === player.currentEnemyIndex ? "border-red-400 bg-red-50" : "border-gray-200"}
                      ${enemy.defeated ? "opacity-30 grayscale" : ""}
                    `}
                  >
                    {enemy.emoji}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Enemy {player.currentEnemyIndex + 1} of {currentLevel.enemies.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Enemy Battle */}
      {currentEnemy && !currentEnemy.defeated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {currentEnemy.emoji} Battle: {currentEnemy.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4 text-center">{currentEnemy.question.text}</p>
            <div className="grid grid-cols-2 gap-3">
              {currentEnemy.question.options.map((option, index) => (
                <Button key={index} variant="outline" onClick={() => handleAnswer(index)} className="h-16 text-sm">
                  {option}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Wrong answer = -25 HP | Correct answer = Defeat enemy + 50 coins
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
