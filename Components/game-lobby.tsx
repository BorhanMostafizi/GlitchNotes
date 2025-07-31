"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Crown, MessageCircle, Copy, Check, Plus, Minus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean
  avatar: string
}

interface GameLobbyProps {
  gameType: string
  roomCode: string
  onStartGame: () => void
  onLeaveLobby: () => void
}

const AVATAR_OPTIONS = ["👤", "🧑", "👩", "🧔", "👱", "🧑‍🦱", "👩‍🦱", "🧑‍🦰", "👩‍🦰", "🧑‍🦲", "👩‍🦲", "🤖", "👽", "🎭"]

export default function GameLobby({ gameType, roomCode, onStartGame, onLeaveLobby }: GameLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "You", isHost: true, isReady: true, avatar: "👤" },
  ])
  const [chatMessages, setChatMessages] = useState<Array<{ player: string; message: string; timestamp: Date }>>([
    { player: "System", message: "Welcome to the lobby!", timestamp: new Date() },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("👤")
  const [copied, setCopied] = useState(false)

  const [bots, setBots] = useState<Array<{ id: string; name: string; difficulty: string; avatar: string }>>([])
  const [botDifficulty, setBotDifficulty] = useState("medium")

  const addBot = () => {
    const botNames = [
      "AlphaBot",
      "CyberMind",
      "QuantumAI",
      "NeuralNet",
      "DeepThink",
      "LogicCore",
      "DataBot",
      "SynthMind",
    ]
    const botAvatars = ["🤖", "👾", "🦾", "🧠", "⚡", "🔮", "💻", "🎯"]

    const newBot = {
      id: `bot-${Date.now()}`,
      name: botNames[Math.floor(Math.random() * botNames.length)],
      difficulty: botDifficulty,
      avatar: botAvatars[Math.floor(Math.random() * botAvatars.length)],
    }

    setBots((prev) => [...prev, newBot])
  }

  const removeBot = () => {
    setBots((prev) => prev.slice(0, -1))
  }

  const currentPlayer = players.find((p) => p.id === "1")
  const isHost = currentPlayer?.isHost || false
  const totalPlayers = players.length + bots.length

  // Different logic for different games
  const getMaxPlayers = () => {
    switch (gameType) {
      case "Among Questions":
        return 30
      case "Super Quizio":
        return 1
      case "Quizmon Battles":
        return 2
      case "Clash of Questions":
        return 2
      default:
        return 8
    }
  }

  const getMaxBots = () => {
    switch (gameType) {
      case "Clash of Questions":
        return 1 // Only 1v1 with AI
      case "Quizmon Battles":
        return 1 // Only 1v1 with AI
      default:
        return 7
    }
  }

  const canStartGame = () => {
    if (gameType === "Clash of Questions" || gameType === "Quizmon Battles") {
      return isHost && totalPlayers === 2 // Exactly 2 players (1 human + 1 bot or 2 humans)
    }
    return isHost && totalPlayers >= 2
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy room code:", err)
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages((prev) => [
        ...prev,
        {
          player: "You",
          message: newMessage.trim(),
          timestamp: new Date(),
        },
      ])
      setNewMessage("")
    }
  }

  const toggleReady = () => {
    setPlayers((prev) => prev.map((p) => (p.id === "1" ? { ...p, isReady: !p.isReady } : p)))
  }

  const getGameDescription = () => {
    switch (gameType) {
      case "Among Questions":
        return "Navigate a 3D spaceship, complete tasks, and find the impostor!"
      case "Super Quizio":
        return "Jump through 3D worlds, battle enemies, and collect coins!"
      case "Quizmon Battles":
        return "Train your 3D Quizmon and battle in the arena!"
      case "Clash of Questions":
        return "Draft warriors and command them in 3D battlefield!"
      default:
        return "Get ready for an epic 3D gaming experience!"
    }
  }

  const getGameEmoji = () => {
    switch (gameType) {
      case "Among Questions":
        return "🚀"
      case "Super Quizio":
        return "🍄"
      case "Quizmon Battles":
        return "⚡"
      case "Clash of Questions":
        return "⚔️"
      default:
        return "🎮"
    }
  }

  const isMultiplayerGame = () => {
    return gameType !== "Super Quizio"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{getGameEmoji()}</div>
                <div>
                  <CardTitle className="text-white text-2xl">{gameType} Lobby</CardTitle>
                  <p className="text-white/80">{getGameDescription()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-white/60 text-sm">Room Code</div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/20 text-white">
                      {roomCode}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={copyRoomCode} className="text-white hover:bg-white/20">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={onLeaveLobby}
                  className="bg-red-500/20 border-red-400 text-white hover:bg-red-500/30"
                >
                  Leave Lobby
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Players Panel */}
        <Card className="lg:col-span-2 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Players ({players.length + bots.length}/{getMaxPlayers()})
              {!isMultiplayerGame() && <span className="ml-2 text-sm">(Single Player)</span>}
              {(gameType === "Clash of Questions" || gameType === "Quizmon Battles") && (
                <span className="ml-2 text-sm">(1v1 Only)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${player.isReady ? "bg-green-500/20 border-green-400" : "bg-gray-500/20 border-gray-400"}
                    ${player.isHost ? "ring-2 ring-yellow-400" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{player.avatar}</div>
                      <div>
                        <div className="text-white font-medium flex items-center">
                          {player.name}
                          {player.isHost && <Crown className="h-4 w-4 ml-1 text-yellow-400" />}
                        </div>
                        <div className={`text-sm ${player.isReady ? "text-green-300" : "text-gray-300"}`}>
                          {player.isReady ? "✓ Ready" : "⏳ Not Ready"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show bots in the player list */}
              {bots.map((bot) => (
                <div key={bot.id} className="p-4 rounded-lg border-2 bg-blue-500/20 border-blue-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{bot.avatar}</div>
                      <div>
                        <div className="text-white font-medium flex items-center">
                          {bot.name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            🤖 {bot.difficulty}
                          </Badge>
                        </div>
                        <div className="text-blue-300 text-sm">✓ AI Ready</div>
                      </div>
                    </div>
                    {isHost && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBots((prev) => prev.filter((b) => b.id !== bot.id))}
                        className="text-white hover:bg-red-500/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {isMultiplayerGame() &&
                Array.from({ length: Math.min(8, getMaxPlayers() - players.length - bots.length) }, (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-4 rounded-lg border-2 border-dashed border-gray-600 bg-gray-500/10"
                  >
                    <div className="text-center text-gray-400">
                      <div className="text-2xl mb-2">👤</div>
                      <div className="text-sm">
                        {gameType === "Clash of Questions" || gameType === "Quizmon Battles"
                          ? "Waiting for opponent..."
                          : "Waiting for player..."}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Bot Management (Host Only) */}
            {isHost && isMultiplayerGame() && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">
                    {gameType === "Clash of Questions" || gameType === "Quizmon Battles" ? "AI Opponent" : "AI Bots"}
                  </h4>
                  <Select value={botDifficulty} onValueChange={setBotDifficulty}>
                    <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🤖 Easy</SelectItem>
                      <SelectItem value="medium">🤖 Medium</SelectItem>
                      <SelectItem value="hard">🤖 Hard</SelectItem>
                      <SelectItem value="expert">🤖 Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={addBot}
                    disabled={bots.length >= getMaxBots()}
                    className="bg-blue-500/20 border-blue-400 text-white hover:bg-blue-500/30"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {gameType === "Clash of Questions" || gameType === "Quizmon Battles"
                      ? "Add AI Opponent"
                      : "Add Bot"}
                  </Button>
                  {bots.length > 0 && (
                    <Button onClick={removeBot} className="bg-red-500/20 border-red-400 text-white hover:bg-red-500/30">
                      <Minus className="h-4 w-4 mr-1" />
                      Remove Bot
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Avatar Selection */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Choose Your Avatar</h4>
              <div className="grid grid-cols-7 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`
                      text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110
                      ${selectedAvatar === avatar ? "border-blue-400 bg-blue-500/20" : "border-gray-600 bg-gray-500/10"}
                    `}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Ready/Start Controls */}
            <div className="flex flex-col items-center space-y-4">
              {isMultiplayerGame() ? (
                <>
                  {!isHost ? (
                    <Button
                      onClick={toggleReady}
                      className={`
                        px-8 py-3 text-lg font-bold
                        ${
                          currentPlayer?.isReady
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }
                      `}
                    >
                      {currentPlayer?.isReady ? "Not Ready" : "Ready Up!"}
                    </Button>
                  ) : (
                    <Button
                      onClick={onStartGame}
                      disabled={!canStartGame()}
                      className={`
                        px-8 py-6 text-xl font-bold w-full
                        ${
                          canStartGame()
                            ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white animate-pulse"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }
                      `}
                    >
                      {canStartGame()
                        ? "🚀 START GAME!"
                        : gameType === "Clash of Questions" || gameType === "Quizmon Battles"
                          ? "Need exactly 2 players to start..."
                          : "Need at least 1 bot to start..."}
                    </Button>
                  )}
                  <div className="text-white/60 text-sm">
                    {isHost ? "You are the host" : "Waiting for host to start"}
                  </div>
                </>
              ) : (
                // Single player game - always show start button
                <Button
                  onClick={onStartGame}
                  className="px-8 py-6 text-xl font-bold w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white animate-pulse"
                >
                  🚀 START GAME!
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-64 overflow-y-auto space-y-2 bg-black/20 rounded-lg p-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <span className={`font-medium ${msg.player === "System" ? "text-yellow-300" : "text-blue-300"}`}>
                      {msg.player}:
                    </span>
                    <span className="text-white/80 ml-2">{msg.message}</span>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <Button onClick={sendMessage} size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Preview */}
        <Card className="mt-6 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Game Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl mb-4">{getGameEmoji()}</div>
              <h3 className="text-white text-xl font-bold mb-2">{gameType}</h3>
              <p className="text-white/80 mb-4">{getGameDescription()}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-white font-medium">Players</div>
                  <div className="text-white/60">
                    {gameType === "Among Questions" ? "4-10" : gameType === "Super Quizio" ? "1" : "2"}
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-white font-medium">Duration</div>
                  <div className="text-white/60">10-20 min</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-white font-medium">Difficulty</div>
                  <div className="text-white/60">Medium</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-white font-medium">Type</div>
                  <div className="text-white/60">3D Adventure</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
