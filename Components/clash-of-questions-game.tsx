"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Progress } from "@/Components/ui/progress"

interface Character {
  id: string
  name: string
  emoji: string
  cost: number
  baseAttack: number
  baseHp: number
  currentAttack: number
  currentHp: number
  maxHp: number
  x: number
  y: number
  isPlayerSide: boolean
  target?: Character | Tower
  lastAttackTime: number
}

interface Tower {
  id: string
  name: string
  emoji: string
  maxHp: number
  currentHp: number
  x: number
  y: number
  isPlayerSide: boolean
  isKingTower: boolean
}

interface Question {
  text: string
  options: string[]
  correct: number
}

const CHARACTERS: Omit<
  Character,
  "currentAttack" | "currentHp" | "maxHp" | "x" | "y" | "isPlayerSide" | "lastAttackTime"
>[] = [
  { id: "knight", name: "Knight", emoji: "⚔️", cost: 3, baseAttack: 150, baseHp: 1400 },
  { id: "archer", name: "Archer", emoji: "🏹", cost: 3, baseAttack: 120, baseHp: 300 },
  { id: "giant", name: "Giant", emoji: "🗿", cost: 5, baseAttack: 300, baseHp: 3000 },
  { id: "wizard", name: "Wizard", emoji: "🧙", cost: 5, baseAttack: 250, baseHp: 600 },
  { id: "dragon", name: "Dragon", emoji: "🐉", cost: 4, baseAttack: 200, baseHp: 800 },
  { id: "pekka", name: "P.E.K.K.A", emoji: "🤖", cost: 7, baseAttack: 600, baseHp: 2800 },
  { id: "goblin", name: "Goblin", emoji: "👹", cost: 2, baseAttack: 100, baseHp: 200 },
  { id: "skeleton", name: "Skeleton", emoji: "💀", cost: 1, baseAttack: 80, baseHp: 150 },
]

const SAMPLE_QUESTIONS: Question[] = [
  { text: "What is 24 + 37?", options: ["59", "60", "61", "62"], correct: 2 },
  { text: "What is the capital of Canada?", options: ["Toronto", "Vancouver", "Ottawa", "Montreal"], correct: 2 },
  { text: "What is 13 × 4?", options: ["50", "51", "52", "53"], correct: 2 },
  { text: "Who wrote '1984'?", options: ["Orwell", "Huxley", "Bradbury", "Vonnegut"], correct: 0 },
  { text: "What is 225 ÷ 15?", options: ["14", "15", "16", "17"], correct: 1 },
  { text: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], correct: 1 },
  { text: "What is 30% of 150?", options: ["40", "45", "50", "55"], correct: 1 },
  { text: "What year did WWI start?", options: ["1913", "1914", "1915", "1916"], correct: 1 },
  { text: "What is the chemical symbol for silver?", options: ["Si", "Ag", "Al", "Au"], correct: 1 },
  { text: "How many sides does an octagon have?", options: ["6", "7", "8", "9"], correct: 2 },
]

export default function ClashOfQuestionsGame() {
  const [gamePhase, setGamePhase] = useState<"questions" | "upgrade" | "battle" | "ended">("questions")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [playerCharacters, setPlayerCharacters] = useState<Character[]>([])
  const [enemyCharacters, setEnemyCharacters] = useState<Character[]>([])
  const [playerTowers, setPlayerTowers] = useState<Tower[]>([])
  const [enemyTowers, setEnemyTowers] = useState<Tower[]>([])
  const [elixir, setElixir] = useState(4)
  const [selectedCard, setSelectedCard] = useState<Character | null>(null)
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (gamePhase === "battle") {
      startBattleLoop()
      const elixirInterval = setInterval(() => {
        setElixir((prev) => Math.min(10, prev + 1))
      }, 2000)
      return () => {
        clearInterval(elixirInterval)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [gamePhase])

  const initializeBattle = () => {
    // Initialize towers
    const newPlayerTowers: Tower[] = [
      {
        id: "player-left",
        name: "Left Tower",
        emoji: "🏰",
        maxHp: 2000,
        currentHp: 2000,
        x: 150,
        y: 400,
        isPlayerSide: true,
        isKingTower: false,
      },
      {
        id: "player-king",
        name: "King Tower",
        emoji: "👑",
        maxHp: 3000,
        currentHp: 3000,
        x: 300,
        y: 450,
        isPlayerSide: true,
        isKingTower: true,
      },
      {
        id: "player-right",
        name: "Right Tower",
        emoji: "🏰",
        maxHp: 2000,
        currentHp: 2000,
        x: 450,
        y: 400,
        isPlayerSide: true,
        isKingTower: false,
      },
    ]

    const newEnemyTowers: Tower[] = [
      {
        id: "enemy-left",
        name: "Left Tower",
        emoji: "🏰",
        maxHp: 2000,
        currentHp: 2000,
        x: 150,
        y: 100,
        isPlayerSide: false,
        isKingTower: false,
      },
      {
        id: "enemy-king",
        name: "King Tower",
        emoji: "👑",
        maxHp: 3000,
        currentHp: 3000,
        x: 300,
        y: 50,
        isPlayerSide: false,
        isKingTower: true,
      },
      {
        id: "enemy-right",
        name: "Right Tower",
        emoji: "🏰",
        maxHp: 2000,
        currentHp: 2000,
        x: 450,
        y: 100,
        isPlayerSide: false,
        isKingTower: false,
      },
    ]

    setPlayerTowers(newPlayerTowers)
    setEnemyTowers(newEnemyTowers)

    // Generate enemy characters
    const enemyChars: Character[] = []
    for (let i = 0; i < 8; i++) {
      const baseChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      const multiplier = 1 + Math.random() * 0.5 // Random upgrade for AI
      enemyChars.push({
        ...baseChar,
        id: `enemy-${i}`,
        currentAttack: Math.round(baseChar.baseAttack * multiplier),
        currentHp: Math.round(baseChar.baseHp * multiplier),
        maxHp: Math.round(baseChar.baseHp * multiplier),
        x: 200 + Math.random() * 200,
        y: 80 + Math.random() * 100,
        isPlayerSide: false,
        lastAttackTime: 0,
      })
    }
    setEnemyCharacters(enemyChars)
  }

  const handleAnswer = (answerIndex: number) => {
    const question = SAMPLE_QUESTIONS[currentQuestion]
    const isCorrect = answerIndex === question.correct

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1)
    }

    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      setGamePhase("upgrade")
    }
  }

  const upgradeCharacters = () => {
    const multiplier = 1 + (correctAnswers / SAMPLE_QUESTIONS.length) * 0.8 // Up to 80% boost
    const upgradedChars: Character[] = []

    for (let i = 0; i < 8; i++) {
      const baseChar = CHARACTERS[i % CHARACTERS.length]
      upgradedChars.push({
        ...baseChar,
        id: `player-${i}`,
        currentAttack: Math.round(baseChar.baseAttack * multiplier),
        currentHp: Math.round(baseChar.baseHp * multiplier),
        maxHp: Math.round(baseChar.baseHp * multiplier),
        x: 200 + Math.random() * 200,
        y: 420 + Math.random() * 50,
        isPlayerSide: true,
        lastAttackTime: 0,
      })
    }

    setPlayerCharacters(upgradedChars)
    initializeBattle()
    setGamePhase("battle")
  }

  const deployCharacter = (x: number, y: number) => {
    if (!selectedCard || elixir < selectedCard.cost) return

    const newChar: Character = {
      ...selectedCard,
      id: `deployed-${Date.now()}`,
      x,
      y: Math.max(250, y), // Keep on player side
      lastAttackTime: 0,
    }

    setPlayerCharacters((prev) => [...prev, newChar])
    setElixir((prev) => prev - selectedCard.cost)
    setSelectedCard(null)
  }

  const startBattleLoop = () => {
    const gameLoop = () => {
      updateCharacters()
      checkWinConditions()
      drawBattle()
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    gameLoop()
  }

  const updateCharacters = () => {
    const allCharacters = [...playerCharacters, ...enemyCharacters]
    const allTowers = [...playerTowers, ...enemyTowers]

    // Update character positions and combat
    setPlayerCharacters((prev) => prev.map((char) => updateCharacter(char, allCharacters, allTowers)))
    setEnemyCharacters((prev) => prev.map((char) => updateCharacter(char, allCharacters, allTowers)))

    // AI deployment
    if (Math.random() < 0.02 && enemyCharacters.length < 15) {
      const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      const aiChar: Character = {
        ...randomChar,
        id: `ai-${Date.now()}`,
        currentAttack: randomChar.baseAttack,
        currentHp: randomChar.baseHp,
        maxHp: randomChar.baseHp,
        x: 200 + Math.random() * 200,
        y: 80 + Math.random() * 100,
        isPlayerSide: false,
        lastAttackTime: 0,
      }
      setEnemyCharacters((prev) => [...prev, aiChar])
    }
  }

  const updateCharacter = (char: Character, allCharacters: Character[], allTowers: Tower[]): Character => {
    if (char.currentHp <= 0) return char

    const now = Date.now()
    const enemies = allCharacters.filter((c) => c.isPlayerSide !== char.isPlayerSide && c.currentHp > 0)
    const enemyTowers = allTowers.filter((t) => t.isPlayerSide !== char.isPlayerSide && t.currentHp > 0)

    // Find nearest target
    let nearestTarget: Character | Tower | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    const allTargets = [...enemies, ...enemyTowers]
    allTargets.forEach((target) => {
      const distance = Math.sqrt((target.x - char.x) ** 2 + (target.y - char.y) ** 2)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestTarget = target
      }
    })

    if (nearestTarget) {
      // Move towards target
      const dx = nearestTarget.x - char.x
      const dy = nearestTarget.y - char.y
      const distance = Math.sqrt(dx ** 2 + dy ** 2)

      if (distance > 50) {
        // Move towards target
        const speed = 2
        return {
          ...char,
          x: char.x + (dx / distance) * speed,
          y: char.y + (dy / distance) * speed,
        }
      } else if (now - char.lastAttackTime > 1000) {
        // Attack target
        if ("currentHp" in nearestTarget) {
          const newHp = nearestTarget.currentHp - char.currentAttack

          if ("isPlayerSide" in nearestTarget && typeof nearestTarget.isPlayerSide === "boolean") {
            // It's a character
            const targetIndex = allCharacters.findIndex((c) => c.id === nearestTarget.id)
            if (targetIndex !== -1) {
              if (nearestTarget.isPlayerSide) {
                setPlayerCharacters((prev) =>
                  prev.map((c) => (c.id === nearestTarget.id ? { ...c, currentHp: Math.max(0, newHp) } : c)),
                )
              } else {
                setEnemyCharacters((prev) =>
                  prev.map((c) => (c.id === nearestTarget.id ? { ...c, currentHp: Math.max(0, newHp) } : c)),
                )
              }
            }
          } else {
            // It's a tower
            if (nearestTarget.isPlayerSide) {
              setPlayerTowers((prev) =>
                prev.map((t) => (t.id === nearestTarget.id ? { ...t, currentHp: Math.max(0, newHp) } : t)),
              )
            } else {
              setEnemyTowers((prev) =>
                prev.map((t) => (t.id === nearestTarget.id ? { ...t, currentHp: Math.max(0, newHp) } : t)),
              )
            }
          }
        }

        return { ...char, lastAttackTime: now }
      }
    }

    return char
  }

  const checkWinConditions = () => {
    const playerKingTower = playerTowers.find((t) => t.isKingTower)
    const enemyKingTower = enemyTowers.find((t) => t.isKingTower)

    if (playerKingTower && playerKingTower.currentHp <= 0) {
      setGameResult("lose")
      setGamePhase("ended")
    } else if (enemyKingTower && enemyKingTower.currentHp <= 0) {
      setGameResult("win")
      setGamePhase("ended")
    }
  }

  const drawBattle = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#4ade80"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw river
    ctx.fillStyle = "#3b82f6"
    ctx.fillRect(0, 240, canvas.width, 20)

    // Draw bridge
    ctx.fillStyle = "#8b4513"
    ctx.fillRect(270, 235, 60, 30)

    // Draw towers
    const allTowers = [...playerTowers, ...enemyTowers]
    allTowers.forEach((tower) => {
      if (tower.currentHp > 0) {
        ctx.font = "24px Arial"
        ctx.textAlign = "center"
        ctx.fillText(tower.emoji, tower.x, tower.y)

        // HP bar
        const barWidth = 40
        const barHeight = 4
        ctx.fillStyle = "#333"
        ctx.fillRect(tower.x - barWidth / 2, tower.y - 35, barWidth, barHeight)
        ctx.fillStyle = tower.isPlayerSide ? "#4ade80" : "#ef4444"
        const hpPercent = tower.currentHp / tower.maxHp
        ctx.fillRect(tower.x - barWidth / 2, tower.y - 35, barWidth * hpPercent, barHeight)
      }
    })

    // Draw characters
    const allCharacters = [...playerCharacters, ...enemyCharacters]
    allCharacters.forEach((char) => {
      if (char.currentHp > 0) {
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.fillText(char.emoji, char.x, char.y)

        // HP bar
        const barWidth = 20
        const barHeight = 2
        ctx.fillStyle = "#333"
        ctx.fillRect(char.x - barWidth / 2, char.y - 20, barWidth, barHeight)
        ctx.fillStyle = char.isPlayerSide ? "#4ade80" : "#ef4444"
        const hpPercent = char.currentHp / char.maxHp
        ctx.fillRect(char.x - barWidth / 2, char.y - 20, barWidth * hpPercent, barHeight)
      }
    })
  }

  // Question phase
  if (gamePhase === "questions") {
    const question = SAMPLE_QUESTIONS[currentQuestion]

    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>⚔️ Answer Questions to Upgrade Your Army</span>
              <span>
                Question {currentQuestion + 1}/{SAMPLE_QUESTIONS.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(currentQuestion / SAMPLE_QUESTIONS.length) * 100} className="mb-2" />
              <p className="text-sm text-gray-600">Correct answers: {correctAnswers}</p>
            </div>

            <p className="text-lg mb-4">{question.text}</p>

            <div className="grid grid-cols-2 gap-3">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleAnswer(index)}
                  className="h-12 text-left justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Upgrade phase
  if (gamePhase === "upgrade") {
    const multiplier = 1 + (correctAnswers / SAMPLE_QUESTIONS.length) * 0.8

    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>⚡ Your Army Has Been Upgraded!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-lg">
                Correct Answers: {correctAnswers}/{SAMPLE_QUESTIONS.length}
              </p>
              <p className="text-sm text-gray-600">Upgrade Multiplier: {multiplier.toFixed(1)}x</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {CHARACTERS.map((char, index) => (
                <Card key={char.id} className="text-center">
                  <CardContent className="p-3">
                    <div className="text-2xl mb-1">{char.emoji}</div>
                    <div className="text-sm font-bold">{char.name}</div>
                    <div className="text-xs text-gray-600">ATK: {Math.round(char.baseAttack * multiplier)}</div>
                    <div className="text-xs text-gray-600">HP: {Math.round(char.baseHp * multiplier)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={upgradeCharacters} className="w-full">
              Enter Battle Arena!
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Battle phase
  if (gamePhase === "battle") {
    const availableCards = playerCharacters.slice(0, 4)

    return (
      <div className="battlefield h-screen flex flex-col">
        {/* Battle Arena */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={500}
            className="w-full h-full cursor-crosshair"
            onClick={(e) => {
              if (selectedCard) {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = (e.clientX - rect.left) * (600 / rect.width)
                const y = (e.clientY - rect.top) * (500 / rect.height)
                deployCharacter(x, y)
              }
            }}
          />

          {/* Elixir Bar */}
          <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded">
            <span className="text-sm">Elixir: {elixir}/10</span>
            <div className="w-20 h-2 bg-purple-800 rounded mt-1">
              <div
                className="h-full bg-purple-400 rounded transition-all"
                style={{ width: `${(elixir / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Hand */}
        <div className="bg-gray-800 p-4 flex justify-center space-x-2">
          {availableCards.map((char, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all ${
                selectedCard?.id === char.id ? "ring-2 ring-blue-500 transform scale-105" : ""
              } ${elixir >= char.cost ? "" : "opacity-50"}`}
              onClick={() => elixir >= char.cost && setSelectedCard(char)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">{char.emoji}</div>
                <div className="text-xs font-bold text-white">{char.name}</div>
                <Badge variant="secondary" className="text-xs">
                  {char.cost}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // End game
  if (gamePhase === "ended") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80">
        <Card className={`${gameResult === "win" ? "bg-green-800" : "bg-red-800"} text-white`}>
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">{gameResult === "win" ? "🏆" : "💀"}</div>
            <div className="text-4xl font-bold mb-4">{gameResult === "win" ? "VICTORY!" : "DEFEAT!"}</div>
            <p className="text-xl mb-4">
              {gameResult === "win" ? "You destroyed the enemy King Tower!" : "Your King Tower has been destroyed!"}
            </p>
            <Button onClick={() => window.location.reload()}>Play Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
