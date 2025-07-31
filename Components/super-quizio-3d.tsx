"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Heart, Coins, Star } from "lucide-react"

interface Player3D {
  x: number
  y: number
  z: number
  hp: number
  coins: number
  lives: number
  isJumping: boolean
  facingDirection: "left" | "right"
}

interface Enemy3D {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  z: number
  defeated: boolean
  question: {
    text: string
    options: string[]
    correct: number
  }
}

interface Platform3D {
  x: number
  y: number
  z: number
  width: number
  height: number
  color: string
  type: "ground" | "platform" | "pipe" | "coin" | "powerup"
}

interface Level3D {
  id: number
  name: string
  background: string
  platforms: Platform3D[]
  enemies: Enemy3D[]
  coins: number
  completed: boolean
}

const MARIO_3D_LEVELS: Level3D[] = [
  {
    id: 1,
    name: "World 1-1: Green Hills",
    background: "#87CEEB",
    platforms: [
      { x: 0, y: 0, z: 0, width: 800, height: 50, color: "#228B22", type: "ground" },
      { x: 200, y: -100, z: 0, width: 100, height: 20, color: "#8B4513", type: "platform" },
      { x: 400, y: -150, z: 0, width: 100, height: 20, color: "#8B4513", type: "platform" },
      { x: 600, y: -80, z: 0, width: 60, height: 120, color: "#00FF00", type: "pipe" },
    ],
    enemies: [
      {
        id: "goomba1",
        name: "Goomba",
        emoji: "🍄",
        x: 300,
        y: -70,
        z: 0,
        defeated: false,
        question: { text: "What is 5 + 3?", options: ["6", "7", "8", "9"], correct: 2 },
      },
      {
        id: "koopa1",
        name: "Koopa Troopa",
        emoji: "🐢",
        x: 500,
        y: -70,
        z: 0,
        defeated: false,
        question: { text: "What is 12 ÷ 4?", options: ["2", "3", "4", "5"], correct: 1 },
      },
    ],
    coins: 100,
    completed: false,
  },
  {
    id: 2,
    name: "World 1-2: Underground Cave",
    background: "#2F4F4F",
    platforms: [
      { x: 0, y: 0, z: 0, width: 800, height: 50, color: "#696969", type: "ground" },
      { x: 150, y: -120, z: 0, width: 80, height: 20, color: "#A0522D", type: "platform" },
      { x: 350, y: -180, z: 0, width: 80, height: 20, color: "#A0522D", type: "platform" },
      { x: 550, y: -100, z: 0, width: 80, height: 20, color: "#A0522D", type: "platform" },
    ],
    enemies: [
      {
        id: "piranha1",
        name: "Piranha Plant",
        emoji: "🌱",
        x: 250,
        y: -70,
        z: 0,
        defeated: false,
        question: { text: "What is the capital of Italy?", options: ["Milan", "Rome", "Naples", "Venice"], correct: 1 },
      },
      {
        id: "buzzy1",
        name: "Buzzy Beetle",
        emoji: "🪲",
        x: 450,
        y: -70,
        z: 0,
        defeated: false,
        question: { text: "What is 7 × 6?", options: ["40", "41", "42", "43"], correct: 2 },
      },
    ],
    coins: 200,
    completed: false,
  },
]

export default function SuperQuizio3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [player, setPlayer] = useState<Player3D>({
    x: 50,
    y: -70,
    z: 0,
    hp: 100,
    coins: 0,
    lives: 3,
    isJumping: false,
    facingDirection: "right",
  })
  const [currentLevel, setCurrentLevel] = useState(0)
  const [levels, setLevels] = useState<Level3D[]>(MARIO_3D_LEVELS)
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy3D | null>(null)
  const [gamePhase, setGamePhase] = useState<"playing" | "victory" | "defeat">("playing")
  const [cameraX, setCameraX] = useState(0)
  const [keys, setKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => new Set(prev).add(e.key.toLowerCase()))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const newKeys = new Set(prev)
        newKeys.delete(e.key.toLowerCase())
        return newKeys
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const gameLoop = () => {
      updatePlayer()
      drawLevel()
    }

    const interval = setInterval(gameLoop, 1000 / 60) // 60 FPS
    return () => clearInterval(interval)
  }, [keys, player, currentLevel])

  const updatePlayer = () => {
    setPlayer((prev) => {
      const newPlayer = { ...prev }

      // Horizontal movement
      if (keys.has("a") || keys.has("arrowleft")) {
        newPlayer.x = Math.max(0, newPlayer.x - 5)
        newPlayer.facingDirection = "left"
      }
      if (keys.has("d") || keys.has("arrowright")) {
        newPlayer.x = Math.min(750, newPlayer.x + 5)
        newPlayer.facingDirection = "right"
      }

      // Jumping
      if ((keys.has(" ") || keys.has("w") || keys.has("arrowup")) && !newPlayer.isJumping) {
        newPlayer.isJumping = true
        newPlayer.y -= 100
        setTimeout(() => {
          setPlayer((p) => ({ ...p, isJumping: false, y: -70 }))
        }, 500)
      }

      // Camera follows player
      setCameraX(Math.max(0, Math.min(400, newPlayer.x - 200)))

      return newPlayer
    })
  }

  const drawLevel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const level = levels[currentLevel]
    if (!level) return

    // Clear canvas with background
    ctx.fillStyle = level.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw clouds
    ctx.fillStyle = "#FFFFFF"
    for (let i = 0; i < 5; i++) {
      const cloudX = (i * 200 - cameraX * 0.5) % (canvas.width + 100)
      drawCloud(ctx, cloudX, 50 + i * 20)
    }

    // Draw platforms
    level.platforms.forEach((platform) => {
      const screenX = platform.x - cameraX
      const screenY = canvas.height + platform.y

      ctx.fillStyle = platform.color

      if (platform.type === "pipe") {
        // Draw pipe with 3D effect
        ctx.fillRect(screenX, screenY - platform.height, platform.width, platform.height)
        ctx.fillStyle = "#006400"
        ctx.fillRect(screenX - 5, screenY - platform.height - 10, platform.width + 10, 20)
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText("PIPE", screenX + platform.width / 2, screenY - platform.height / 2)
      } else {
        // Regular platform with 3D effect
        ctx.fillRect(screenX, screenY, platform.width, platform.height)

        // 3D top
        ctx.fillStyle = lightenColor(platform.color, 20)
        ctx.fillRect(screenX, screenY - 5, platform.width, 5)

        // 3D side
        ctx.fillStyle = darkenColor(platform.color, 20)
        ctx.fillRect(screenX + platform.width, screenY - 5, 5, platform.height + 5)
      }
    })

    // Draw enemies
    level.enemies.forEach((enemy) => {
      if (!enemy.defeated) {
        const screenX = enemy.x - cameraX
        const screenY = canvas.height + enemy.y

        // Enemy shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)"
        ctx.beginPath()
        ctx.ellipse(screenX, screenY + 10, 20, 8, 0, 0, 2 * Math.PI)
        ctx.fill()

        // Enemy character
        ctx.font = "40px Arial"
        ctx.textAlign = "center"
        ctx.fillText(enemy.emoji, screenX, screenY)

        // Enemy name
        ctx.fillStyle = "#000000"
        ctx.font = "12px Arial"
        ctx.fillText(enemy.name, screenX, screenY + 25)
      }
    })

    // Draw player
    const playerScreenX = player.x - cameraX
    const playerScreenY = canvas.height + player.y

    // Player shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)"
    ctx.beginPath()
    ctx.ellipse(playerScreenX, playerScreenY + 10, 15, 8, 0, 0, 2 * Math.PI)
    ctx.fill()

    // Player character (Mario-style)
    ctx.font = "30px Arial"
    ctx.textAlign = "center"
    if (player.isJumping) {
      ctx.fillText("🦘", playerScreenX, playerScreenY - 20)
    } else {
      ctx.fillText(player.facingDirection === "right" ? "🏃‍♂️" : "🏃‍♀️", playerScreenX, playerScreenY)
    }

    // Draw UI elements
    drawUI(ctx)
  }

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, 2 * Math.PI)
    ctx.arc(x + 25, y, 25, 0, 2 * Math.PI)
    ctx.arc(x + 50, y, 20, 0, 2 * Math.PI)
    ctx.arc(x + 25, y - 15, 15, 0, 2 * Math.PI)
    ctx.fill()
  }

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Health bar
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(10, 10, 200, 20)
    ctx.fillStyle = "#00FF00"
    ctx.fillRect(10, 10, (player.hp / 100) * 200, 20)
    ctx.strokeStyle = "#000000"
    ctx.strokeRect(10, 10, 200, 20)

    // Coins
    ctx.fillStyle = "#FFD700"
    ctx.font = "20px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`🪙 ${player.coins}`, 10, 60)

    // Lives
    ctx.fillText(`❤️ ${player.lives}`, 10, 90)

    // Level
    ctx.fillText(`Level: ${currentLevel + 1}`, 10, 120)
  }

  const lightenColor = (color: string, percent: number) => {
    const num = Number.parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    )
  }

  const darkenColor = (color: string, percent: number) => {
    const num = Number.parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) - amt
    const G = ((num >> 8) & 0x00ff) - amt
    const B = (num & 0x0000ff) - amt
    return (
      "#" +
      (
        0x1000000 +
        (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
        (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
        (B > 255 ? 255 : B < 0 ? 0 : B)
      )
        .toString(16)
        .slice(1)
    )
  }

  const handleEnemyClick = (enemy: Enemy3D) => {
    const distance = Math.abs(enemy.x - player.x)
    if (distance > 100) {
      alert("Get closer to the enemy to battle!")
      return
    }
    setSelectedEnemy(enemy)
  }

  const handleAnswer = (answerIndex: number) => {
    if (!selectedEnemy) return

    const isCorrect = answerIndex === selectedEnemy.question.correct
    const level = levels[currentLevel]

    if (isCorrect) {
      // Defeat enemy
      setLevels((prev) =>
        prev.map((lvl, index) => {
          if (index === currentLevel) {
            const updatedEnemies = lvl.enemies.map((enemy) =>
              enemy.id === selectedEnemy.id ? { ...enemy, defeated: true } : enemy,
            )
            return { ...lvl, enemies: updatedEnemies }
          }
          return lvl
        }),
      )

      setPlayer((prev) => ({ ...prev, coins: prev.coins + 50 }))
      alert(`✅ Defeated ${selectedEnemy.name}! +50 coins`)

      // Check if level is complete
      const allEnemiesDefeated = level.enemies.every((enemy) => enemy.id === selectedEnemy.id || enemy.defeated)

      if (allEnemiesDefeated) {
        setPlayer((prev) => ({ ...prev, coins: prev.coins + level.coins }))
        alert(`🎉 Level ${currentLevel + 1} complete! +${level.coins} bonus coins!`)

        if (currentLevel >= levels.length - 1) {
          setGamePhase("victory")
        } else {
          setCurrentLevel((prev) => prev + 1)
          setPlayer((prev) => ({ ...prev, x: 50, y: -70 }))
          setCameraX(0)
        }
      }
    } else {
      const newHp = Math.max(0, player.hp - 25)
      setPlayer((prev) => ({ ...prev, hp: newHp }))

      if (newHp <= 0) {
        setGamePhase("defeat")
        alert("💀 Game Over! You ran out of HP!")
      } else {
        alert(`❌ Wrong answer! -25 HP (${newHp}/100 remaining)`)
      }
    }

    setSelectedEnemy(null)
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
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 p-4">
      {/* Game Controls */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-1" />
                <Progress value={player.hp} className="w-32 h-2" />
                <span className="ml-2">{player.hp}/100</span>
              </div>
              <div className="flex items-center">
                <Coins className="h-5 w-5 text-yellow-500 mr-1" />
                <span>{player.coins}</span>
              </div>
              <div className="flex items-center">
                <span>❤️ {player.lives}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Use WASD or Arrow Keys to move • Space to jump • Click enemies to battle
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Game Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <Star className="h-5 w-5 mr-2" />
            {levels[currentLevel]?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full border border-gray-300 rounded-lg cursor-pointer"
            onClick={(e) => {
              const canvas = canvasRef.current
              if (!canvas) return

              const rect = canvas.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top

              // Convert screen coordinates to game coordinates
              const gameX = (x / canvas.offsetWidth) * canvas.width + cameraX
              const gameY = (y / canvas.offsetHeight) * canvas.height

              // Check for enemy clicks
              const level = levels[currentLevel]
              level?.enemies.forEach((enemy) => {
                if (!enemy.defeated) {
                  const enemyScreenX = enemy.x - cameraX
                  const enemyScreenY = canvas.height + enemy.y

                  if (
                    Math.abs((x / canvas.offsetWidth) * canvas.width - enemyScreenX) < 30 &&
                    Math.abs((y / canvas.offsetHeight) * canvas.height - enemyScreenY) < 30
                  ) {
                    handleEnemyClick(enemy)
                  }
                }
              })
            }}
          />
        </CardContent>
      </Card>

      {/* Enemy Battle Modal */}
      {selectedEnemy && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {selectedEnemy.emoji} Battle: {selectedEnemy.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4 text-center">{selectedEnemy.question.text}</p>
            <div className="grid grid-cols-2 gap-3">
              {selectedEnemy.question.options.map((option, index) => (
                <Button key={index} variant="outline" onClick={() => handleAnswer(index)} className="h-16 text-sm">
                  {option}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Wrong answer = -25 HP | Correct answer = Defeat enemy + 50 coins
            </div>
            <Button variant="ghost" className="mt-4 w-full" onClick={() => setSelectedEnemy(null)}>
              Run Away
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
