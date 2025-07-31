"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Coins, Star, Play, Pause } from "lucide-react"

interface Flashcard {
  id: string
  front: string
  back: string
  category: string
}

interface MarioPlayer {
  x: number
  y: number
  velocityY: number
  isJumping: boolean
  isOnGround: boolean
  facingDirection: "left" | "right"
  lives: number
  coins: number
  score: number
  isMoving: boolean
}

interface GameObject {
  id: string
  type: "platform" | "enemy" | "coin" | "pipe" | "flag" | "block" | "movingPlatform" | "fireball" | "spikes"
  x: number
  y: number
  width: number
  height: number
  color: string
  emoji?: string
  hasQuestion?: boolean
  defeated?: boolean
  collected?: boolean
  // Moving object properties
  velocityX?: number
  velocityY?: number
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
  // Animation properties
  animationFrame?: number
  rotationSpeed?: number
}

interface SuperMarioQuizioProps {
  flashcards: Flashcard[]
}

export default function SuperMarioQuizio({ flashcards }: SuperMarioQuizioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [gameState, setGameState] = useState<"playing" | "paused" | "question" | "gameOver" | "victory">("playing")
  const [currentQuestion, setCurrentQuestion] = useState<Flashcard | null>(null)
  const [questionTarget, setQuestionTarget] = useState<GameObject | null>(null)
  const [cameraX, setCameraX] = useState(0)
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [scrollSpeed, setScrollSpeed] = useState(1) // Auto-scroll speed
  const [gameTime, setGameTime] = useState(0)

  const [mario, setMario] = useState<MarioPlayer>({
    x: 150,
    y: 300,
    velocityY: 0,
    isJumping: false,
    isOnGround: false,
    facingDirection: "right",
    lives: 3,
    coins: 0,
    score: 0,
    isMoving: false,
  })

  // Create a more challenging Mario-style level with moving obstacles
  const [gameObjects, setGameObjects] = useState<GameObject[]>([
    // Ground platforms
    { id: "ground1", type: "platform", x: 0, y: 400, width: 600, height: 50, color: "#228B22" },
    { id: "ground2", type: "platform", x: 700, y: 400, width: 400, height: 50, color: "#228B22" },
    { id: "ground3", type: "platform", x: 1200, y: 400, width: 500, height: 50, color: "#228B22" },
    { id: "ground4", type: "platform", x: 1800, y: 400, width: 600, height: 50, color: "#228B22" },

    // Floating platforms
    { id: "plat1", type: "platform", x: 250, y: 320, width: 80, height: 15, color: "#8B4513" },
    { id: "plat2", type: "platform", x: 450, y: 280, width: 80, height: 15, color: "#8B4513" },
    { id: "plat3", type: "platform", x: 900, y: 320, width: 100, height: 15, color: "#8B4513" },
    { id: "plat4", type: "platform", x: 1400, y: 300, width: 80, height: 15, color: "#8B4513" },

    // Moving platforms
    {
      id: "movePlat1",
      type: "movingPlatform",
      x: 600,
      y: 350,
      width: 80,
      height: 15,
      color: "#FF6347",
      velocityY: 2,
      minY: 300,
      maxY: 380,
    },
    {
      id: "movePlat2",
      type: "movingPlatform",
      x: 1100,
      y: 250,
      width: 80,
      height: 15,
      color: "#FF6347",
      velocityX: 1.5,
      minX: 1050,
      maxX: 1200,
    },

    // Pipes (can stand on top)
    { id: "pipe1", type: "pipe", x: 350, y: 340, width: 50, height: 60, color: "#00AA00", emoji: "🟢" },
    { id: "pipe2", type: "pipe", x: 800, y: 320, width: 50, height: 80, color: "#00AA00", emoji: "🟢" },
    { id: "pipe3", type: "pipe", x: 1600, y: 340, width: 50, height: 60, color: "#00AA00", emoji: "🟢" },

    // Enemies with questions
    {
      id: "enemy1",
      type: "enemy",
      x: 300,
      y: 360,
      width: 35,
      height: 35,
      color: "#8B4513",
      emoji: "🍄",
      hasQuestion: true,
      velocityX: -0.5,
      minX: 250,
      maxX: 400,
    },
    {
      id: "enemy2",
      type: "enemy",
      x: 750,
      y: 360,
      width: 35,
      height: 35,
      color: "#228B22",
      emoji: "🐢",
      hasQuestion: true,
      velocityX: 0.8,
      minX: 700,
      maxX: 850,
    },
    {
      id: "enemy3",
      type: "enemy",
      x: 1300,
      y: 360,
      width: 35,
      height: 35,
      color: "#FF6347",
      emoji: "🌱",
      hasQuestion: true,
    },

    // Animated spinning coins
    { id: "coin1", type: "coin", x: 280, y: 290, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin2", type: "coin", x: 480, y: 250, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin3", type: "coin", x: 375, y: 310, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin4", type: "coin", x: 825, y: 290, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin5", type: "coin", x: 930, y: 290, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin6", type: "coin", x: 1130, y: 220, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin7", type: "coin", x: 1430, y: 270, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },
    { id: "coin8", type: "coin", x: 1625, y: 310, width: 20, height: 20, color: "#FFD700", animationFrame: 0 },

    // Moving fireballs
    {
      id: "fireball1",
      type: "fireball",
      x: 500,
      y: 200,
      width: 25,
      height: 25,
      color: "#FF4500",
      emoji: "🔥",
      velocityX: -2,
      velocityY: 1,
      minX: 400,
      maxX: 600,
      minY: 150,
      maxY: 350,
    },
    {
      id: "fireball2",
      type: "fireball",
      x: 1000,
      y: 180,
      width: 25,
      height: 25,
      color: "#FF4500",
      emoji: "🔥",
      velocityX: 1.5,
      velocityY: -1.5,
      minX: 950,
      maxX: 1150,
      minY: 150,
      maxY: 300,
    },

    // Spike traps
    { id: "spikes1", type: "spikes", x: 650, y: 385, width: 40, height: 15, color: "#666666", emoji: "⚡" },
    { id: "spikes2", type: "spikes", x: 1150, y: 385, width: 40, height: 15, color: "#666666", emoji: "⚡" },

    // Flag at the end
    { id: "flag", type: "flag", x: 2200, y: 300, width: 40, height: 100, color: "#FF0000", emoji: "🏁" },
  ])

  // Keyboard controls
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

  // Auto-scroll and game physics
  const updateGame = useCallback(() => {
    if (gameState !== "playing") return

    setGameTime((prev) => prev + 1)

    // Auto-scroll the camera
    setCameraX((prev) => prev + scrollSpeed)

    // Update moving objects
    setGameObjects((prevObjects) =>
      prevObjects.map((obj) => {
        const newObj = { ...obj }

        // Update coin animation
        if (obj.type === "coin" && !obj.collected) {
          newObj.animationFrame = ((obj.animationFrame || 0) + 1) % 60
        }

        // Update moving platforms
        if (obj.type === "movingPlatform") {
          if (obj.velocityX) {
            newObj.x += obj.velocityX
            if (newObj.x <= (obj.minX || 0) || newObj.x >= (obj.maxX || 1000)) {
              newObj.velocityX = -obj.velocityX
            }
          }
          if (obj.velocityY) {
            newObj.y += obj.velocityY
            if (newObj.y <= (obj.minY || 0) || newObj.y >= (obj.maxY || 400)) {
              newObj.velocityY = -obj.velocityY
            }
          }
        }

        // Update moving enemies
        if (obj.type === "enemy" && !obj.defeated && obj.velocityX) {
          newObj.x += obj.velocityX
          if (newObj.x <= (obj.minX || 0) || newObj.x >= (obj.maxX || 1000)) {
            newObj.velocityX = -obj.velocityX
          }
        }

        // Update fireballs
        if (obj.type === "fireball") {
          newObj.x += obj.velocityX || 0
          newObj.y += obj.velocityY || 0

          // Bounce off boundaries
          if (newObj.x <= (obj.minX || 0) || newObj.x >= (obj.maxX || 1000)) {
            newObj.velocityX = -(obj.velocityX || 0)
          }
          if (newObj.y <= (obj.minY || 0) || newObj.y >= (obj.maxY || 400)) {
            newObj.velocityY = -(obj.velocityY || 0)
          }
        }

        return newObj
      }),
    )

    setMario((prevMario) => {
      const newMario = { ...prevMario }

      // Horizontal movement
      newMario.isMoving = false
      if (keys.has("a") || keys.has("arrowleft")) {
        newMario.x = Math.max(cameraX - 50, newMario.x - 4) // Can't go too far left
        newMario.facingDirection = "left"
        newMario.isMoving = true
      }
      if (keys.has("d") || keys.has("arrowright")) {
        newMario.x += 4
        newMario.facingDirection = "right"
        newMario.isMoving = true
      }

      // Variable height jumping
      if ((keys.has(" ") || keys.has("w") || keys.has("arrowup")) && newMario.isOnGround) {
        newMario.velocityY = -16
        newMario.isJumping = true
        newMario.isOnGround = false
      }

      // Variable jump height - release jump key for shorter jumps
      if (newMario.isJumping && newMario.velocityY < -8 && !keys.has(" ") && !keys.has("w") && !keys.has("arrowup")) {
        newMario.velocityY = -8 // Cut jump short
      }

      // Gravity
      newMario.velocityY += 0.8
      newMario.y += newMario.velocityY

      // Platform collision detection (including pipes as solid objects)
      newMario.isOnGround = false
      gameObjects.forEach((obj) => {
        if (
          (obj.type === "platform" || obj.type === "movingPlatform" || obj.type === "pipe") &&
          !obj.collected &&
          !obj.defeated
        ) {
          // Top collision (standing on platform/pipe)
          if (
            newMario.x < obj.x + obj.width &&
            newMario.x + 30 > obj.x &&
            newMario.y + 40 > obj.y &&
            newMario.y + 40 < obj.y + obj.height + 15 &&
            newMario.velocityY > 0
          ) {
            newMario.y = obj.y - 40
            newMario.velocityY = 0
            newMario.isOnGround = true
            newMario.isJumping = false

            // If on moving platform, move with it
            if (obj.type === "movingPlatform" && obj.velocityX) {
              newMario.x += obj.velocityX
            }
          }

          // Side collision (can't walk through pipes)
          if (obj.type === "pipe") {
            // Left side collision
            if (
              newMario.x + 30 > obj.x &&
              newMario.x + 30 < obj.x + 10 &&
              newMario.y < obj.y + obj.height &&
              newMario.y + 40 > obj.y
            ) {
              newMario.x = obj.x - 30
            }
            // Right side collision
            if (
              newMario.x < obj.x + obj.width &&
              newMario.x > obj.x + obj.width - 10 &&
              newMario.y < obj.y + obj.height &&
              newMario.y + 40 > obj.y
            ) {
              newMario.x = obj.x + obj.width
            }
          }
        }
      })

      // Check enemy and hazard collisions
      gameObjects.forEach((obj) => {
        if (
          (obj.type === "enemy" || obj.type === "fireball" || obj.type === "spikes") &&
          !obj.defeated &&
          !obj.collected
        ) {
          if (
            newMario.x < obj.x + obj.width &&
            newMario.x + 30 > obj.x &&
            newMario.y < obj.y + obj.height &&
            newMario.y + 40 > obj.y
          ) {
            if (obj.type === "enemy" && obj.hasQuestion) {
              // Enemy collision - trigger question
              const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)]
              setCurrentQuestion(randomCard)
              setQuestionTarget(obj)
              setGameState("question")
            } else {
              // Hazard collision - lose life immediately
              newMario.lives -= 1
              if (newMario.lives <= 0) {
                setGameState("gameOver")
              } else {
                // Respawn behind camera
                newMario.x = cameraX + 50
                newMario.y = 300
                newMario.velocityY = 0
                alert(`💥 Hit a hazard! Lives remaining: ${newMario.lives}`)
              }
            }
          }
        }
      })

      // Check coin collisions
      setGameObjects((prevObjects) =>
        prevObjects.map((obj) => {
          if (obj.type === "coin" && !obj.collected) {
            if (
              newMario.x < obj.x + obj.width &&
              newMario.x + 30 > obj.x &&
              newMario.y < obj.y + obj.height &&
              newMario.y + 40 > obj.y
            ) {
              newMario.coins += 1
              newMario.score += 200
              return { ...obj, collected: true }
            }
          }
          return obj
        }),
      )

      // Check flag collision (victory)
      gameObjects.forEach((obj) => {
        if (obj.type === "flag") {
          if (
            newMario.x < obj.x + obj.width &&
            newMario.x + 30 > obj.x &&
            newMario.y < obj.y + obj.height &&
            newMario.y + 40 > obj.y
          ) {
            setGameState("victory")
          }
        }
      })

      // Death if falling off screen or falling behind camera
      if (newMario.y > 500 || newMario.x < cameraX - 100) {
        newMario.lives -= 1
        if (newMario.lives <= 0) {
          setGameState("gameOver")
        } else {
          // Respawn
          newMario.x = cameraX + 100
          newMario.y = 300
          newMario.velocityY = 0
          alert(`💀 Fell off the screen! Lives remaining: ${newMario.lives}`)
        }
      }

      // Increase scroll speed over time
      if (gameTime % 1800 === 0 && scrollSpeed < 3) {
        // Every 30 seconds, increase speed
        setScrollSpeed((prev) => prev + 0.2)
      }

      return newMario
    })
  }, [gameState, keys, gameObjects, flashcards, cameraX, gameTime, scrollSpeed])

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      updateGame()
      drawGame()
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    if (gameState === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [updateGame, gameState])

  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas with sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#98FB98")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw moving clouds
    ctx.fillStyle = "#FFFFFF"
    for (let i = 0; i < 15; i++) {
      const cloudX = (i * 200 - cameraX * 0.2) % (canvas.width + 300)
      drawCloud(ctx, cloudX, 40 + (i % 4) * 25)
    }

    // Draw game objects
    gameObjects.forEach((obj) => {
      if (obj.collected) return // Don't draw collected coins

      const screenX = obj.x - cameraX
      const screenY = obj.y

      // Only draw if on screen
      if (screenX > -obj.width - 50 && screenX < canvas.width + 50) {
        ctx.fillStyle = obj.color

        if (obj.type === "platform") {
          // Draw platform with 3D effect
          ctx.fillRect(screenX, screenY, obj.width, obj.height)
          // 3D top
          ctx.fillStyle = lightenColor(obj.color, 30)
          ctx.fillRect(screenX, screenY - 3, obj.width, 3)
          // 3D side
          ctx.fillStyle = darkenColor(obj.color, 30)
          ctx.fillRect(screenX + obj.width, screenY - 3, 3, obj.height + 3)
        } else if (obj.type === "movingPlatform") {
          // Draw moving platform with special effect
          ctx.fillRect(screenX, screenY, obj.width, obj.height)
          // Glowing effect
          ctx.strokeStyle = "#FFFF00"
          ctx.lineWidth = 2
          ctx.strokeRect(screenX - 1, screenY - 1, obj.width + 2, obj.height + 2)
        } else if (obj.type === "pipe") {
          // Draw pipe with 3D effect
          ctx.fillRect(screenX, screenY, obj.width, obj.height)
          ctx.fillStyle = "#006400"
          ctx.fillRect(screenX - 5, screenY - 10, obj.width + 10, 15)
          // Pipe details
          ctx.fillStyle = "#004400"
          ctx.fillRect(screenX + 5, screenY, 5, obj.height)
          ctx.fillRect(screenX + obj.width - 10, screenY, 5, obj.height)
        } else if (obj.type === "coin") {
          // Draw animated spinning coin
          const frame = Math.floor((obj.animationFrame || 0) / 10) % 6
          const coinSprites = ["🪙", "💰", "🟡", "💛", "🟨", "✨"]
          ctx.font = "20px Arial"
          ctx.textAlign = "center"

          // Coin glow effect
          ctx.shadowColor = "#FFD700"
          ctx.shadowBlur = 10
          ctx.fillText(coinSprites[frame], screenX + obj.width / 2, screenY + obj.height / 2 + 7)
          ctx.shadowBlur = 0
        } else if (obj.type === "spikes") {
          // Draw spikes
          ctx.fillStyle = "#666666"
          ctx.fillRect(screenX, screenY, obj.width, obj.height)
          // Draw spike points
          ctx.fillStyle = "#444444"
          for (let i = 0; i < obj.width; i += 8) {
            ctx.beginPath()
            ctx.moveTo(screenX + i, screenY + obj.height)
            ctx.lineTo(screenX + i + 4, screenY)
            ctx.lineTo(screenX + i + 8, screenY + obj.height)
            ctx.closePath()
            ctx.fill()
          }
        } else {
          // Draw other objects with emoji
          if (obj.emoji) {
            ctx.font = obj.type === "fireball" ? "25px Arial" : "30px Arial"
            ctx.textAlign = "center"

            // Special effects for fireballs
            if (obj.type === "fireball") {
              ctx.shadowColor = "#FF4500"
              ctx.shadowBlur = 15
            }

            ctx.fillText(obj.emoji, screenX + obj.width / 2, screenY + obj.height / 2 + 10)
            ctx.shadowBlur = 0
          } else {
            ctx.fillRect(screenX, screenY, obj.width, obj.height)
          }
        }

        // Draw defeated overlay for enemies
        if (obj.type === "enemy" && obj.defeated) {
          ctx.fillStyle = "rgba(0,0,0,0.7)"
          ctx.fillRect(screenX, screenY, obj.width, obj.height)
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "20px Arial"
          ctx.textAlign = "center"
          ctx.fillText("💀", screenX + obj.width / 2, screenY + obj.height / 2 + 7)
        }
      }
    })

    // Draw Mario
    const marioScreenX = mario.x - cameraX
    const marioScreenY = mario.y

    // Mario shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)"
    ctx.beginPath()
    ctx.ellipse(marioScreenX + 15, marioScreenY + 45, 15, 5, 0, 0, 2 * Math.PI)
    ctx.fill()

    // Mario character with better animations
    ctx.font = "35px Arial"
    ctx.textAlign = "center"

    if (mario.isJumping) {
      ctx.fillText("🤸‍♂️", marioScreenX + 15, marioScreenY + 30)
    } else if (mario.isMoving) {
      const runFrame = Math.floor(gameTime / 8) % 2
      const runSprites = mario.facingDirection === "right" ? ["🏃‍♂️", "🚶‍♂️"] : ["🏃‍♀️", "🚶‍♀️"]
      ctx.fillText(runSprites[runFrame], marioScreenX + 15, marioScreenY + 30)
    } else {
      ctx.fillText("🧍‍♂️", marioScreenX + 15, marioScreenY + 30)
    }

    // Draw speed indicator
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "14px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Speed: ${scrollSpeed.toFixed(1)}x`, 10, canvas.height - 10)
  }

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, 2 * Math.PI)
    ctx.arc(x + 15, y, 18, 0, 2 * Math.PI)
    ctx.arc(x + 30, y, 12, 0, 2 * Math.PI)
    ctx.arc(x + 15, y - 8, 10, 0, 2 * Math.PI)
    ctx.fill()
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

  const handleQuestionAnswer = (answer: string) => {
    if (!currentQuestion || !questionTarget) return

    const isCorrect = answer.toLowerCase().trim() === currentQuestion.back.toLowerCase().trim()

    if (isCorrect) {
      // Correct answer - defeat enemy and continue
      setGameObjects((prev) => prev.map((obj) => (obj.id === questionTarget.id ? { ...obj, defeated: true } : obj)))
      setMario((prev) => ({ ...prev, score: prev.score + 500 }))
      alert("✅ Correct! Enemy defeated! +500 points!")
    } else {
      // Wrong answer - lose a life and ask another question
      setMario((prev) => {
        const newLives = prev.lives - 1
        if (newLives <= 0) {
          setGameState("gameOver")
          return { ...prev, lives: 0 }
        }
        return { ...prev, lives: newLives }
      })

      // Ask another question
      const newQuestion = flashcards[Math.floor(Math.random() * flashcards.length)]
      setCurrentQuestion(newQuestion)
      alert(`❌ Wrong answer! Lives remaining: ${mario.lives - 1}`)
      return // Stay in question mode
    }

    // Resume game
    setCurrentQuestion(null)
    setQuestionTarget(null)
    setGameState("playing")
  }

  const togglePause = () => {
    setGameState(gameState === "paused" ? "playing" : "paused")
  }

  const restartGame = () => {
    setMario({
      x: 150,
      y: 300,
      velocityY: 0,
      isJumping: false,
      isOnGround: false,
      facingDirection: "right",
      lives: 3,
      coins: 0,
      score: 0,
      isMoving: false,
    })
    setCameraX(0)
    setScrollSpeed(1)
    setGameTime(0)
    setGameObjects((prev) => prev.map((obj) => ({ ...obj, defeated: false, collected: false, animationFrame: 0 })))
    setGameState("playing")
  }

  if (gameState === "victory") {
    return (
      <Card className="border-yellow-400">
        <CardContent className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">🏆 Victory!</h2>
          <p className="text-lg mb-4">You reached the flag and survived the auto-scroll!</p>
          <p className="mb-2">Final Score: {mario.score} points</p>
          <p className="mb-2">Coins Collected: {mario.coins}</p>
          <p className="mb-4">Max Speed Reached: {scrollSpeed.toFixed(1)}x</p>
          <Button onClick={restartGame}>Play Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (gameState === "gameOver") {
    return (
      <Card className="border-red-400">
        <CardContent className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">💀 Game Over!</h2>
          <p className="text-lg mb-4">You couldn't keep up with the auto-scroll!</p>
          <p className="mb-2">Final Score: {mario.score} points</p>
          <p className="mb-4">Coins Collected: {mario.coins}</p>
          <Button onClick={restartGame}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 p-4">
      {/* Game UI */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-1" />
                <span>❤️ × {mario.lives}</span>
              </div>
              <div className="flex items-center">
                <Coins className="h-5 w-5 text-yellow-500 mr-1" />
                <span>{mario.coins}</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-purple-500 mr-1" />
                <span>Score: {mario.score}</span>
              </div>
              <div className="text-sm bg-red-100 px-2 py-1 rounded">🏃‍♂️ Auto-Scroll: {scrollSpeed.toFixed(1)}x</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={togglePause}>
                {gameState === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {gameState === "paused" ? "Resume" : "Pause"}
              </Button>
              <div className="text-sm text-gray-600">WASD/Arrows • Space to jump • Don't fall behind!</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🍄 Super Quizio Adventure - Auto-Scroll Challenge!</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="w-full border border-gray-300 rounded-lg"
            style={{ imageRendering: "pixelated" }}
          />
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-white text-2xl font-bold">PAUSED</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Modal */}
      {gameState === "question" && currentQuestion && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">❓ Quick! Answer to Continue!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4 text-center font-bold">{currentQuestion.front}</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Type your answer quickly..."
                className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleQuestionAnswer((e.target as HTMLInputElement).value)
                  }
                }}
                autoFocus
              />
              <div className="text-center text-sm text-red-600 font-bold">
                ⚠️ The screen keeps scrolling! Answer fast or you'll fall behind!
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
