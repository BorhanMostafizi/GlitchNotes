"use client"

import { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { Input } from "@/Components/ui/input"
import { Users, AlertCircle } from "lucide-react"
import GameLobby from "./game-lobby"
import SuperMarioQuizio from "./super-mario-quizio"
import FlashcardRequirement from "./flashcard-requirement"

interface GameRoom {
  id: string
  code: string
  players: string[]
  gameType: string
  flashcards?: Array<{ id: string; front: string; back: string; category: string }>
  botSettings?: {
    enabled: boolean
    count: number
    difficulty: "easy" | "medium" | "hard" | "expert"
  }
}

export default function GameModes() {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [gameStarted, setGameStarted] = useState(false)
  const [showFlashcardRequirement, setShowFlashcardRequirement] = useState(false)
  const [pendingGameType, setPendingGameType] = useState<string>("")
  const [showBotConfig, setShowBotConfig] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [botSettings, setBotSettings] = useState({
    enabled: false,
    count: 1,
    difficulty: "medium" as "easy" | "medium" | "hard" | "expert",
  })

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase()
  }

  const createRoom = (gameType: string) => {
    // Show coming soon popup for multiplayer games
    if (gameType !== "Super Quizio") {
      setShowComingSoon(true)
      return
    }

    setPendingGameType(gameType)
    setShowFlashcardRequirement(true)
  }

  const handleFlashcardsReady = (flashcards: Array<{ id: string; front: string; back: string; category: string }>) => {
    const code = generateRoomCode()
    const room: GameRoom = {
      id: Date.now().toString(),
      code,
      players: [playerName || "Player 1"],
      gameType: pendingGameType,
      flashcards,
      botSettings,
    }
    setGameRoom(room)
    setShowFlashcardRequirement(false)

    // Auto-start single player games
    if (pendingGameType === "Super Quizio") {
      setTimeout(() => setGameStarted(true), 100)
    }
  }

  const cancelFlashcardCreation = () => {
    setShowFlashcardRequirement(false)
    setShowBotConfig(false)
    setPendingGameType("")
  }

  const joinRoom = () => {
    if (joinCode && playerName) {
      const room: GameRoom = {
        id: Date.now().toString(),
        code: joinCode,
        players: [playerName, "Other Player"],
        gameType: "Among Questions",
        flashcards: [], // In a real app, this would be fetched from the host
      }
      setGameRoom(room)
    }
  }

  const startGame = () => {
    setGameStarted(true)
  }

  const leaveLobby = () => {
    setGameRoom(null)
    setGameStarted(false)
    setShowFlashcardRequirement(false)
    setShowBotConfig(false)
    setPendingGameType("")
  }

  // Coming Soon Modal
  if (showComingSoon) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Coming Soon!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🚧</div>
              <p className="text-gray-700 mb-4">
                Multiplayer games are currently in development and will be available soon!
              </p>
              <p className="text-sm text-gray-600 mb-4">
                For now, you can enjoy <strong>Super Quizio</strong> - our single-player Mario-style platformer game.
              </p>
            </div>
            <Button onClick={() => setShowComingSoon(false)} className="w-full">
              Got it!
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show flashcard requirement screen
  if (showFlashcardRequirement) {
    return <FlashcardRequirement onFlashcardsReady={handleFlashcardsReady} onCancel={cancelFlashcardCreation} />
  }

  // If game has started, show the actual game
  if (gameStarted && gameRoom) {
    return (
      <div>{gameRoom.gameType === "Super Quizio" && <SuperMarioQuizio flashcards={gameRoom.flashcards || []} />}</div>
    )
  }

  // If in a room but game hasn't started, show lobby
  if (gameRoom && !gameStarted) {
    return (
      <GameLobby
        gameType={gameRoom.gameType}
        roomCode={gameRoom.code}
        onStartGame={startGame}
        onLeaveLobby={leaveLobby}
      />
    )
  }

  // Main menu - no room created yet
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Game Modes</h2>

      <div className="mb-6">
        <Input
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="mb-4"
        />
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Game</TabsTrigger>
          <TabsTrigger value="join">Join Game</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-blue-800 mb-2">📚 Flashcard Requirement</h3>
            <p className="text-blue-700 text-sm">
              You'll need to create at least 10 flashcards before starting any game. These will be used as questions
              during gameplay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-400 opacity-50"
              onClick={() => createRoom("Among Questions")}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">🚀</span>
                  Among Questions
                  <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Coming Soon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Navigate a 3D spaceship with interactive rooms. Citizens complete tasks while impostors eliminate crew
                  members!
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">3D Movement</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Vent System</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Social Deduction</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">🤖 AI Bots</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Users className="h-3 w-3 mr-1" /> 4-30 players • Multiplayer
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-400"
              onClick={() => createRoom("Super Quizio")}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">🍄</span>
                  Super Quizio
                  <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Available</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Mario-style 3D platformer! Jump through colorful worlds, battle enemies, and collect coins by
                  answering questions!
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Platformer</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Collectibles</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Boss Battles</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Users className="h-3 w-3 mr-1" /> 1 player • Single Player
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-yellow-400 opacity-50"
              onClick={() => createRoom("Quizmon Battles")}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">⚡</span>
                  Quizmon Battles
                  <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Coming Soon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Pokemon-style tournament! Train your 3D Quizmon for 3 minutes, then battle in the arena. Stats boost
                  with correct answers!
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Training</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Turn-Based</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Strategy</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">🤖 AI Bots</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Users className="h-3 w-3 mr-1" /> 2 players • Multiplayer
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-400 opacity-50"
              onClick={() => createRoom("Clash of Questions")}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">⚔️</span>
                  Clash of Questions
                  <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Coming Soon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Draft 20 warriors by answering questions faster than your opponent. Command your army in 3D
                  battlefield combat!
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Draft</span>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Real-time</span>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Army Builder</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">🤖 AI vs Human</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Users className="h-3 w-3 mr-1" /> 2 players only • 1v1 Battle
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="join" className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-orange-800">Multiplayer Not Available</span>
            </div>
            <p className="text-orange-700 text-sm">
              Multiplayer functionality is currently in development. You can only play Super Quizio (single-player) at
              this time.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-4 opacity-50">
            <Input
              placeholder="Enter 5-letter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={5}
              disabled
            />
            <Button onClick={joinRoom} className="w-full" disabled>
              <Users className="h-4 w-4 mr-2" />
              Join Game (Coming Soon)
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
