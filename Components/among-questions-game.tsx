"use client"

import { useState, useEffect } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Skull, Clock } from "lucide-react"

interface Player {
  id: string
  name: string
  role: "impostor" | "citizen"
  currentRoom: string
  isAlive: boolean
  canMove: boolean
  questionsCompleted: number
}

interface Room {
  id: string
  name: string
  description: string
  question: {
    text: string
    options: string[]
    correct: number
  }
  completed: boolean
  x: number
  y: number
}

const SPACESHIP_ROOMS: Room[] = [
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "The main dining area",
    question: { text: "What is 15 + 27?", options: ["40", "42", "45", "48"], correct: 1 },
    completed: false,
    x: 2,
    y: 2,
  },
  {
    id: "weapons",
    name: "Weapons",
    description: "Weapon systems control",
    question: { text: "What is the capital of Japan?", options: ["Seoul", "Tokyo", "Beijing", "Bangkok"], correct: 1 },
    completed: false,
    x: 0,
    y: 0,
  },
  {
    id: "o2",
    name: "O2",
    description: "Oxygen filtration system",
    question: { text: "What is 8 × 7?", options: ["54", "56", "58", "60"], correct: 1 },
    completed: false,
    x: 4,
    y: 0,
  },
  {
    id: "navigation",
    name: "Navigation",
    description: "Ship navigation controls",
    question: { text: "What is the largest planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correct: 2 },
    completed: false,
    x: 4,
    y: 2,
  },
  {
    id: "shields",
    name: "Shields",
    description: "Defensive systems",
    question: { text: "What is 144 ÷ 12?", options: ["11", "12", "13", "14"], correct: 1 },
    completed: false,
    x: 4,
    y: 4,
  },
  {
    id: "communications",
    name: "Communications",
    description: "Ship communication array",
    question: {
      text: "Who wrote Romeo and Juliet?",
      options: ["Dickens", "Shakespeare", "Austen", "Wilde"],
      correct: 1,
    },
    completed: false,
    x: 2,
    y: 4,
  },
  {
    id: "storage",
    name: "Storage",
    description: "Supply storage area",
    question: { text: "What is 25% of 80?", options: ["15", "20", "25", "30"], correct: 1 },
    completed: false,
    x: 0,
    y: 4,
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Power distribution center",
    question: { text: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2 },
    completed: false,
    x: 0,
    y: 2,
  },
  {
    id: "medbay",
    name: "Medbay",
    description: "Medical facility",
    question: { text: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correct: 1 },
    completed: false,
    x: 1,
    y: 1,
  },
  {
    id: "security",
    name: "Security",
    description: "Security monitoring room",
    question: { text: "What is the square root of 64?", options: ["6", "7", "8", "9"], correct: 2 },
    completed: false,
    x: 3,
    y: 1,
  },
  {
    id: "reactor",
    name: "Reactor",
    description: "Nuclear reactor core",
    question: { text: "What year did WWII end?", options: ["1944", "1945", "1946", "1947"], correct: 1 },
    completed: false,
    x: 1,
    y: 3,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Administrative center",
    question: { text: "What is 3³ (3 cubed)?", options: ["9", "18", "27", "36"], correct: 2 },
    completed: false,
    x: 3,
    y: 3,
  },
]

export default function AmongQuestionsGame() {
  const [player, setPlayer] = useState<Player>({
    id: "player1",
    name: "You",
    role: Math.random() < 0.3 ? "impostor" : "citizen",
    currentRoom: "cafeteria",
    isAlive: true,
    canMove: true,
    questionsCompleted: 0,
  })
  const [rooms, setRooms] = useState<Room[]>(SPACESHIP_ROOMS)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [gamePhase, setGamePhase] = useState<"playing" | "voting" | "ended">("playing")
  const [moveTimer, setMoveTimer] = useState(0)
  const [canKill, setCanKill] = useState(false)

  useEffect(() => {
    if (moveTimer > 0) {
      const timer = setTimeout(() => setMoveTimer(moveTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setPlayer((prev) => ({ ...prev, canMove: true }))
    }
  }, [moveTimer])

  const handleRoomClick = (room: Room) => {
    if (!player.canMove || !player.isAlive) return
    if (moveTimer > 0) return

    const currentRoom = rooms.find((r) => r.id === player.currentRoom)
    if (!currentRoom) return

    // Check if rooms are adjacent (simple grid-based adjacency)
    const distance = Math.abs(room.x - currentRoom.x) + Math.abs(room.y - currentRoom.y)
    if (distance > 1) {
      alert("You can only move to adjacent rooms!")
      return
    }

    setPlayer((prev) => ({ ...prev, currentRoom: room.id }))
    setSelectedRoom(room)
  }

  const handleAnswerQuestion = (answerIndex: number) => {
    if (!selectedRoom) return

    const isCorrect = answerIndex === selectedRoom.question.correct

    if (isCorrect) {
      // Mark room as completed
      setRooms((prev) => prev.map((r) => (r.id === selectedRoom.id ? { ...r, completed: true } : r)))
      setPlayer((prev) => ({ ...prev, questionsCompleted: prev.questionsCompleted + 1 }))

      if (player.role === "impostor") {
        setCanKill(true)
        alert("✅ Correct! You can now use the kill button!")
      } else {
        alert("✅ Correct! Room task completed!")
      }

      // Check win condition for citizens
      const completedRooms = rooms.filter((r) => r.completed).length + 1
      if (completedRooms >= 8 && player.role === "citizen") {
        alert("🎉 Citizens win! All tasks completed!")
        setGamePhase("ended")
      }
    } else {
      // Wrong answer - freeze for 5 seconds
      setPlayer((prev) => ({ ...prev, canMove: false }))
      setMoveTimer(5)
      alert("❌ Wrong answer! You're frozen for 5 seconds!")
    }

    setSelectedRoom(null)
  }

  const handleKill = () => {
    if (player.role !== "impostor" || !canKill) return

    alert("💀 You eliminated a crewmate!")
    setCanKill(false)

    // Simple win condition for impostor
    if (Math.random() < 0.5) {
      alert("🔴 Impostor wins!")
      setGamePhase("ended")
    }
  }

  const currentRoom = rooms.find((r) => r.id === player.currentRoom)

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Badge variant={player.role === "impostor" ? "destructive" : "default"}>
              {player.role === "impostor" ? "🔴 IMPOSTOR" : "🔵 CITIZEN"}
            </Badge>
            <span className="text-sm">Tasks: {player.questionsCompleted}/8</span>
            {moveTimer > 0 && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Frozen: {moveTimer}s
              </Badge>
            )}
          </div>
          {player.role === "impostor" && (
            <Button variant="destructive" onClick={handleKill} disabled={!canKill} size="sm">
              <Skull className="h-4 w-4 mr-1" />
              Kill
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🚀 Spaceship Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 mb-4" style={{ aspectRatio: "5/5" }}>
              {Array.from({ length: 25 }, (_, i) => {
                const x = i % 5
                const y = Math.floor(i / 5)
                const room = rooms.find((r) => r.x === x && r.y === y)

                return (
                  <div
                    key={i}
                    className={`
                      aspect-square border-2 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all
                      ${room ? "border-blue-300 bg-blue-50 hover:bg-blue-100" : "border-gray-200 bg-gray-50"}
                      ${room?.id === player.currentRoom ? "ring-2 ring-yellow-400 bg-yellow-100" : ""}
                      ${room?.completed ? "bg-green-100 border-green-300" : ""}
                      ${!player.canMove || moveTimer > 0 ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onClick={() => room && handleRoomClick(room)}
                  >
                    {room ? (
                      <div className="text-center">
                        <div className="text-xs">{room.name}</div>
                        {room.completed && <div className="text-green-600">✓</div>}
                        {room.id === player.currentRoom && <div className="text-yellow-600">👤</div>}
                      </div>
                    ) : (
                      <div className="text-gray-400">·</div>
                    )}
                  </div>
                )
              })}
            </div>

            {currentRoom && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Current Location: <strong>{currentRoom.name}</strong>
                </p>
                <p className="text-xs text-gray-500">{currentRoom.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedRoom && !selectedRoom.completed && (
        <Card>
          <CardHeader>
            <CardTitle>📝 {selectedRoom.name} Task</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-lg">{selectedRoom.question.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {selectedRoom.question.options.map((option, index) => (
                <Button key={index} variant="outline" onClick={() => handleAnswerQuestion(index)} className="h-12">
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {gamePhase === "ended" && (
        <Card className="border-yellow-400">
          <CardContent className="text-center p-6">
            <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
            <Button onClick={() => window.location.reload()}>Play Again</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
