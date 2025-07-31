"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, MessageCircle, Timer } from "lucide-react"

interface Player {
  id: string
  name: string
  color: string
  x: number
  y: number
  isAlive: boolean
  isImpostor: boolean
  tasks: Task[]
  completedTasks: number
}

interface Task {
  id: string
  roomId: string
  x: number
  y: number
  question: string
  options: string[]
  correct: number
  completed: boolean
}

interface Room {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  hasVent?: boolean
}

interface DeadBody {
  id: string
  playerId: string
  x: number
  y: number
  color: string
}

interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

const ROOMS: Room[] = [
  { id: "cafeteria", name: "Cafeteria", x: 300, y: 200, width: 200, height: 150, color: "#8B4513" },
  {
    id: "upper-engine",
    name: "Upper Engine",
    x: 100,
    y: 100,
    width: 150,
    height: 100,
    color: "#FF6B35",
    hasVent: true,
  },
  { id: "reactor", name: "Reactor", x: 50, y: 250, width: 120, height: 120, color: "#4ECDC4" },
  { id: "security", name: "Security", x: 200, y: 380, width: 100, height: 80, color: "#45B7D1" },
  { id: "medbay", name: "Medbay", x: 350, y: 380, width: 120, height: 100, color: "#96CEB4", hasVent: true },
  { id: "electrical", name: "Electrical", x: 500, y: 350, width: 100, height: 120, color: "#FFEAA7", hasVent: true },
  { id: "storage", name: "Storage", x: 650, y: 300, width: 120, height: 100, color: "#DDA0DD" },
  { id: "admin", name: "Admin", x: 550, y: 200, width: 100, height: 80, color: "#F39C12" },
  { id: "communications", name: "Communications", x: 700, y: 150, width: 100, height: 100, color: "#E74C3C" },
  { id: "o2", name: "O2", x: 600, y: 50, width: 120, height: 100, color: "#3498DB" },
  { id: "navigation", name: "Navigation", x: 750, y: 250, width: 100, height: 80, color: "#9B59B6" },
  { id: "weapons", name: "Weapons", x: 800, y: 100, width: 100, height: 100, color: "#E67E22" },
  { id: "shields", name: "Shields", x: 750, y: 350, width: 100, height: 80, color: "#1ABC9C" },
  {
    id: "lower-engine",
    name: "Lower Engine",
    x: 100,
    y: 400,
    width: 150,
    height: 100,
    color: "#FF6B35",
    hasVent: true,
  },
]

const SAMPLE_QUESTIONS = [
  { text: "What is 15 + 27?", options: ["40", "41", "42", "43"], correct: 2 },
  { text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2 },
  { text: "What is 8 × 7?", options: ["54", "55", "56", "57"], correct: 2 },
  { text: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Monet"], correct: 1 },
  { text: "What is 144 ÷ 12?", options: ["11", "12", "13", "14"], correct: 1 },
  { text: "What is the largest planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correct: 2 },
  { text: "What is 25% of 80?", options: ["15", "20", "25", "30"], correct: 1 },
  { text: "In what year did WWII end?", options: ["1944", "1945", "1946", "1947"], correct: 1 },
  { text: "What is H2O?", options: ["Hydrogen", "Helium", "Water", "Oxygen"], correct: 2 },
  { text: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
]

export default function AmongQuestions3D() {
  const [gamePhase, setGamePhase] = useState<"playing" | "meeting" | "voting" | "ended">("playing")
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [deadBodies, setDeadBodies] = useState<DeadBody[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [killCooldown, setKillCooldown] = useState(0)
  const [meetingTimer, setMeetingTimer] = useState(30)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [votes, setVotes] = useState<{ [playerId: string]: string }>({})
  const [gameResult, setGameResult] = useState<"win" | "lose" | "impostor_win" | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [])

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (gamePhase === "playing") {
        updateAIPlayers()
        checkWinConditions()
        if (killCooldown > 0) {
          setKillCooldown((prev) => prev - 1)
        }
      } else if (gamePhase === "meeting" && meetingTimer > 0) {
        setMeetingTimer((prev) => prev - 1)
      } else if (gamePhase === "meeting" && meetingTimer === 0) {
        setGamePhase("voting")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gamePhase, killCooldown, meetingTimer])

  // Draw game
  useEffect(() => {
    drawGame()
  }, [players, deadBodies, selectedTask])

  const initializeGame = () => {
    const newPlayers: Player[] = [
      {
        id: "player",
        name: "You",
        color: "#3498DB",
        x: 400,
        y: 300,
        isAlive: true,
        isImpostor: Math.random() < 0.3,
        tasks: generateTasks(),
        completedTasks: 0,
      },
    ]

    // Add AI players
    const colors = ["#E74C3C", "#2ECC71", "#F39C12", "#9B59B6", "#1ABC9C", "#E67E22"]
    for (let i = 0; i < 6; i++) {
      const isImpostor = newPlayers.filter((p) => p.isImpostor).length === 0 && i === 5 ? true : Math.random() < 0.2
      newPlayers.push({
        id: `ai-${i}`,
        name: `Player ${i + 2}`,
        color: colors[i],
        x: 200 + Math.random() * 600,
        y: 150 + Math.random() * 300,
        isAlive: true,
        isImpostor,
        tasks: generateTasks(),
        completedTasks: 0,
      })
    }

    setPlayers(newPlayers)
    setCurrentPlayer(newPlayers[0])
  }

  const generateTasks = (): Task[] => {
    const tasks: Task[] = []
    const shuffledRooms = [...ROOMS].sort(() => Math.random() - 0.5)

    for (let i = 0; i < 10; i++) {
      const room = shuffledRooms[i % shuffledRooms.length]
      const question = SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)]

      tasks.push({
        id: `task-${i}`,
        roomId: room.id,
        x: room.x + Math.random() * (room.width - 40),
        y: room.y + Math.random() * (room.height - 40),
        question: question.text,
        options: question.options,
        correct: question.correct,
        completed: false,
      })
    }

    return tasks
  }

  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#2C3E50"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw rooms
    ROOMS.forEach((room) => {
      ctx.fillStyle = room.color
      ctx.fillRect(room.x, room.y, room.width, room.height)

      // Room label
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(room.name, room.x + room.width / 2, room.y + room.height / 2)

      // Vent indicator
      if (room.hasVent) {
        ctx.fillStyle = "#34495E"
        ctx.fillRect(room.x + 5, room.y + 5, 20, 20)
        ctx.fillStyle = "white"
        ctx.font = "10px Arial"
        ctx.fillText("V", room.x + 15, room.y + 17)
      }
    })

    // Draw current player's tasks
    if (currentPlayer && currentPlayer.isAlive) {
      currentPlayer.tasks.forEach((task) => {
        if (!task.completed) {
          ctx.fillStyle = "#F1C40F"
          ctx.fillRect(task.x, task.y, 20, 20)
          ctx.fillStyle = "black"
          ctx.font = "12px Arial"
          ctx.textAlign = "center"
          ctx.fillText("!", task.x + 10, task.y + 15)
        }
      })
    }

    // Draw dead bodies
    deadBodies.forEach((body) => {
      ctx.fillStyle = body.color
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("💀", body.x, body.y)
    })

    // Draw players
    players.forEach((player) => {
      if (player.isAlive) {
        ctx.fillStyle = player.color
        ctx.beginPath()
        ctx.arc(player.x, player.y, 15, 0, 2 * Math.PI)
        ctx.fill()

        // Player name
        ctx.fillStyle = "white"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.fillText(player.name, player.x, player.y - 20)

        // Impostor indicator
        if (player.id === "player" && player.isImpostor) {
          ctx.fillStyle = "#E74C3C"
          ctx.font = "8px Arial"
          ctx.fillText("IMPOSTOR", player.x, player.y + 25)
        }
      }
    })
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentPlayer || !currentPlayer.isAlive || gamePhase !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Check for task interaction
    if (!currentPlayer.isImpostor) {
      const nearbyTask = currentPlayer.tasks.find(
        (task) =>
          !task.completed &&
          Math.abs(task.x - currentPlayer.x) < 30 &&
          Math.abs(task.y - currentPlayer.y) < 30 &&
          Math.abs(task.x - x) < 20 &&
          Math.abs(task.y - y) < 20,
      )

      if (nearbyTask) {
        setSelectedTask(nearbyTask)
        return
      }
    }

    // Check for body reporting
    const nearbyBody = deadBodies.find(
      (body) =>
        Math.abs(body.x - currentPlayer.x) < 40 &&
        Math.abs(body.y - currentPlayer.y) < 40 &&
        Math.abs(body.x - x) < 30 &&
        Math.abs(body.y - y) < 30,
    )

    if (nearbyBody) {
      reportBody()
      return
    }

    // Check for kill (impostor only)
    if (currentPlayer.isImpostor && killCooldown === 0) {
      const nearbyPlayer = players.find(
        (player) =>
          player.id !== "player" &&
          player.isAlive &&
          Math.abs(player.x - currentPlayer.x) < 40 &&
          Math.abs(player.y - currentPlayer.y) < 40 &&
          Math.abs(player.x - x) < 30 &&
          Math.abs(player.y - y) < 30,
      )

      if (nearbyPlayer) {
        killPlayer(nearbyPlayer)
        return
      }
    }

    // Move player
    setCurrentPlayer((prev) => (prev ? { ...prev, x, y } : null))
    setPlayers((prev) => prev.map((p) => (p.id === "player" ? { ...p, x, y } : p)))
  }

  const killPlayer = (target: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === target.id ? { ...p, isAlive: false } : p)))

    setDeadBodies((prev) => [
      ...prev,
      {
        id: `body-${target.id}`,
        playerId: target.id,
        x: target.x,
        y: target.y,
        color: target.color,
      },
    ])

    setKillCooldown(30)
  }

  const reportBody = () => {
    setChatMessages([])
    setMeetingTimer(30)
    setGamePhase("meeting")
  }

  const completeTask = (taskId: string, answerIndex: number) => {
    if (!currentPlayer) return

    const task = currentPlayer.tasks.find((t) => t.id === taskId)
    if (!task) return

    const isCorrect = answerIndex === task.correct

    if (isCorrect) {
      setCurrentPlayer((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
              completedTasks: prev.completedTasks + 1,
            }
          : null,
      )

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === "player"
            ? {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
                completedTasks: p.completedTasks + 1,
              }
            : p,
        ),
      )
    }

    setSelectedTask(null)
  }

  const updateAIPlayers = () => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id === "player" || !player.isAlive) return player

        // AI movement
        const newX = player.x + (Math.random() - 0.5) * 20
        const newY = player.y + (Math.random() - 0.5) * 20

        // AI task completion (citizens only)
        let newCompletedTasks = player.completedTasks
        if (!player.isImpostor && Math.random() < 0.02) {
          const incompleteTasks = player.tasks.filter((t) => !t.completed)
          if (incompleteTasks.length > 0) {
            const taskToComplete = incompleteTasks[0]
            player.tasks = player.tasks.map((t) => (t.id === taskToComplete.id ? { ...t, completed: true } : t))
            newCompletedTasks++
          }
        }

        // AI impostor kills
        if (player.isImpostor && Math.random() < 0.01) {
          const nearbyTargets = prev.filter(
            (p) =>
              p.id !== player.id &&
              p.isAlive &&
              !p.isImpostor &&
              Math.abs(p.x - player.x) < 50 &&
              Math.abs(p.y - player.y) < 50,
          )

          if (nearbyTargets.length > 0) {
            const target = nearbyTargets[0]
            setTimeout(() => killPlayer(target), 100)
          }
        }

        return {
          ...player,
          x: Math.max(50, Math.min(850, newX)),
          y: Math.max(50, Math.min(450, newY)),
          completedTasks: newCompletedTasks,
        }
      }),
    )
  }

  const checkWinConditions = () => {
    const alivePlayers = players.filter((p) => p.isAlive)
    const aliveImpostors = alivePlayers.filter((p) => p.isImpostor)
    const aliveCitizens = alivePlayers.filter((p) => !p.isImpostor)

    // Impostors win if they equal or outnumber citizens
    if (aliveImpostors.length >= aliveCitizens.length) {
      setGameResult("impostor_win")
      setGamePhase("ended")
      return
    }

    // Citizens win if all tasks completed
    const totalTasks = players.filter((p) => p.isAlive && !p.isImpostor).reduce((sum, p) => sum + p.tasks.length, 0)
    const completedTasks = players
      .filter((p) => p.isAlive && !p.isImpostor)
      .reduce((sum, p) => sum + p.completedTasks, 0)

    if (totalTasks > 0 && completedTasks >= totalTasks) {
      setGameResult(currentPlayer?.isImpostor ? "lose" : "win")
      setGamePhase("ended")
      return
    }

    // Check if current player is dead
    if (currentPlayer && !currentPlayer.isAlive) {
      setGameResult("lose")
      setGamePhase("ended")
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !currentPlayer) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      message: newMessage,
      timestamp: Date.now(),
    }

    setChatMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const vote = (targetId: string) => {
    if (!currentPlayer) return
    setVotes((prev) => ({ ...prev, [currentPlayer.id]: targetId }))
  }

  const endVoting = () => {
    const voteCounts: { [playerId: string]: number } = {}
    Object.values(votes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
    })

    const maxVotes = Math.max(...Object.values(voteCounts))
    const ejected = Object.keys(voteCounts).find((id) => voteCounts[id] === maxVotes)

    if (ejected && ejected !== "skip") {
      setPlayers((prev) => prev.map((p) => (p.id === ejected ? { ...p, isAlive: false } : p)))

      const ejectedPlayer = players.find((p) => p.id === ejected)
      if (ejectedPlayer?.isImpostor) {
        setGameResult(currentPlayer?.isImpostor ? "lose" : "win")
        setGamePhase("ended")
        return
      }
    }

    setVotes({})
    setGamePhase("playing")
  }

  // Game over screens
  if (gamePhase === "ended") {
    if (gameResult === "lose") {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <Card className="bg-red-900 border-red-700 text-white">
            <CardContent className="text-center p-8">
              <div className="text-6xl mb-4">💀</div>
              <div className="text-4xl font-bold mb-4">THE END</div>
              <p className="text-xl">You have been eliminated</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (gameResult === "impostor_win") {
      return (
        <div className="fixed inset-0 bg-red-900 flex items-center justify-center">
          <Card className="bg-red-800 border-red-600 text-white">
            <CardContent className="text-center p-8">
              <div className="text-6xl mb-4">👹</div>
              <div className="text-4xl font-bold mb-4">IMPOSTORS WIN</div>
              <p className="text-xl">The crew has been eliminated</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (gameResult === "win") {
      return (
        <div className="fixed inset-0 bg-green-900 flex items-center justify-center">
          <Card className="bg-green-800 border-green-600 text-white">
            <CardContent className="text-center p-8">
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-4xl font-bold mb-4">YOU WIN</div>
              <p className="text-xl">Victory achieved!</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Meeting phase
  if (gamePhase === "meeting") {
    return (
      <div className="fixed inset-0 bg-red-900/90 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🚨 Emergency Meeting</span>
              <div className="flex items-center">
                <Timer className="h-4 w-4 mr-1" />
                {meetingTimer}s
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 mb-4 border rounded p-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <span className="font-bold">{msg.playerName}: </span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </ScrollArea>

            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Discuss who the impostor might be..."
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="bg-gray-800 text-white"
              />
              <Button onClick={sendMessage}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Voting phase
  if (gamePhase === "voting") {
    const alivePlayers = players.filter((p) => p.isAlive)

    return (
      <div className="fixed inset-0 bg-blue-900/90 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 text-white">
          <CardHeader>
            <CardTitle>🗳️ Voting Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {alivePlayers.map((player) => (
                <Button
                  key={player.id}
                  variant={votes[currentPlayer?.id || ""] === player.id ? "default" : "outline"}
                  onClick={() => vote(player.id)}
                  className="w-full justify-start"
                  style={{ borderColor: player.color }}
                >
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: player.color }} />
                  {player.name}
                </Button>
              ))}
              <Button
                variant={votes[currentPlayer?.id || ""] === "skip" ? "default" : "outline"}
                onClick={() => vote("skip")}
                className="w-full"
              >
                Skip Vote
              </Button>
            </div>

            <Button onClick={endVoting} className="w-full">
              Confirm Vote
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Task question modal
  if (selectedTask) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Task</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{selectedTask.question}</p>
            <div className="space-y-2">
              {selectedTask.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => completeTask(selectedTask.id, index)}
                  className="w-full text-left justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setSelectedTask(null)} className="w-full mt-4">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main game view
  return (
    <div className="game-container">
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <div className="flex items-center space-x-4">
          <Badge variant={currentPlayer?.isImpostor ? "destructive" : "default"}>
            {currentPlayer?.isImpostor ? "IMPOSTOR" : "CREWMATE"}
          </Badge>
          <span>Tasks: {currentPlayer?.completedTasks || 0}/10</span>
          {currentPlayer?.isImpostor && killCooldown > 0 && <span>Kill Cooldown: {killCooldown}s</span>}
        </div>

        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{players.filter((p) => p.isAlive).length} alive</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={900}
        height={500}
        onClick={handleCanvasClick}
        className="border cursor-pointer bg-gray-900"
      />

      <div className="p-4 bg-gray-800 text-white text-sm">
        <p>
          {currentPlayer?.isImpostor
            ? "Kill crewmates and sabotage their tasks. Use vents to travel quickly!"
            : "Complete all tasks to win. Report dead bodies and vote out the impostor!"}
        </p>
        <p className="mt-1 text-gray-400">
          Click to move • Click on yellow task markers to complete tasks • Click on bodies to report
          {currentPlayer?.isImpostor && " • Click on players to kill them"}
        </p>
      </div>
    </div>
  )
}
