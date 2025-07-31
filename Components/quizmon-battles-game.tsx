"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sword, Shield, Clock, Zap, Badge } from "lucide-react"

interface Quizmon {
  id: string
  name: string
  emoji: string
  attack: number
  defense: number
  hp: number
  maxHp: number
}

const STARTER_QUIZMONS: Quizmon[] = [
  { id: "pikachu", name: "Pikachu", emoji: "⚡", attack: 10, defense: 8, hp: 100, maxHp: 100 },
  { id: "charmander", name: "Charmander", emoji: "🔥", attack: 12, defense: 6, hp: 100, maxHp: 100 },
  { id: "squirtle", name: "Squirtle", emoji: "💧", attack: 8, defense: 12, hp: 100, maxHp: 100 },
  { id: "bulbasaur", name: "Bulbasaur", emoji: "🌱", attack: 9, defense: 10, hp: 100, maxHp: 100 },
]

const TRAINING_QUESTIONS = [
  { text: "What is 15 + 28?", options: ["41", "42", "43", "44"], correct: 2 },
  { text: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
  { text: "What is 9 × 8?", options: ["70", "71", "72", "73"], correct: 2 },
  { text: "Who painted the Mona Lisa?", options: ["Picasso", "Van Gogh", "Da Vinci", "Monet"], correct: 2 },
  { text: "What is 169 ÷ 13?", options: ["12", "13", "14", "15"], correct: 1 },
  { text: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correct: 2 },
  { text: "What year did the Titanic sink?", options: ["1910", "1911", "1912", "1913"], correct: 2 },
  { text: "What is 25% of 200?", options: ["40", "45", "50", "55"], correct: 2 },
  { text: "What is the chemical symbol for iron?", options: ["Ir", "In", "Fe", "Fr"], correct: 2 },
  { text: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
]

export default function QuizmonBattlesGame() {
  const [gamePhase, setGamePhase] = useState<"select" | "training" | "battle" | "ended">("select")
  const [playerQuizmon, setPlayerQuizmon] = useState<Quizmon | null>(null)
  const [enemyQuizmon, setEnemyQuizmon] = useState<Quizmon | null>(null)
  const [trainingTimeLeft, setTrainingTimeLeft] = useState(180) // 3 minutes
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [currentTurn, setCurrentTurn] = useState<"player" | "enemy">("player")

  const [aiOpponent, setAiOpponent] = useState({
    name: "Professor Oak",
    difficulty: "medium" as "easy" | "medium" | "hard" | "expert",
    quizmon: null as Quizmon | null,
    questionsAnswered: 0,
    trainingProgress: 0,
  })

  // AI training simulation
  useEffect(() => {
    if (gamePhase === "training" && trainingTimeLeft > 0) {
      const aiInterval = setInterval(() => {
        setAiOpponent((prev) => {
          const answerRate = {
            easy: 0.6,
            medium: 0.75,
            hard: 0.85,
            expert: 0.95,
          }[prev.difficulty]

          if (Math.random() < answerRate && prev.quizmon) {
            const statToUpgrade = Math.random() < 0.5 ? "attack" : "defense"
            const upgradedQuizmon = {
              ...prev.quizmon,
              [statToUpgrade]: prev.quizmon[statToUpgrade] + 5,
            }

            return {
              ...prev,
              quizmon: upgradedQuizmon,
              questionsAnswered: prev.questionsAnswered + 1,
              trainingProgress: Math.min(100, prev.trainingProgress + 2),
            }
          }
          return prev
        })
      }, 2000) // AI answers every 2 seconds

      return () => clearInterval(aiInterval)
    }
  }, [gamePhase, trainingTimeLeft])

  useEffect(() => {
    if (gamePhase === "training" && trainingTimeLeft > 0) {
      const timer = setTimeout(() => setTrainingTimeLeft(trainingTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gamePhase === "training" && trainingTimeLeft === 0) {
      startBattle()
    }
  }, [gamePhase, trainingTimeLeft])

  // AI battle logic
  const executeAIBattleTurn = () => {
    if (!playerQuizmon || !enemyQuizmon || currentTurn !== "enemy") return

    // AI decision making based on difficulty
    const strategies = {
      easy: () => Math.random() < 0.3, // 30% optimal moves
      medium: () => Math.random() < 0.6, // 60% optimal moves
      hard: () => Math.random() < 0.8, // 80% optimal moves
      expert: () => Math.random() < 0.95, // 95% optimal moves
    }

    const makeOptimalMove = strategies[aiOpponent.difficulty]()

    // Calculate damage with AI strategy
    let damage = Math.max(1, enemyQuizmon.attack - playerQuizmon.defense)

    if (makeOptimalMove) {
      // AI uses optimal strategy
      if (enemyQuizmon.hp < enemyQuizmon.maxHp * 0.3) {
        damage = Math.floor(damage * 1.5) // Desperate attack
      } else if (playerQuizmon.hp < playerQuizmon.maxHp * 0.3) {
        damage = Math.floor(damage * 1.2) // Finish off opponent
      }
    }

    const newHp = Math.max(0, playerQuizmon.hp - damage)
    setPlayerQuizmon((prev) => (prev ? { ...prev, hp: newHp } : prev))

    setBattleLog((prev) => [
      ...prev,
      `🤖 ${aiOpponent.name}'s ${enemyQuizmon.name} uses ${makeOptimalMove ? "Strategic" : "Basic"} Attack for ${damage} damage!`,
    ])

    if (newHp <= 0) {
      setBattleLog((prev) => [...prev, `🏆 ${aiOpponent.name} wins with superior AI tactics!`])
      setGamePhase("ended")
      return
    }

    setCurrentTurn("player")
  }

  const selectQuizmon = (quizmon: Quizmon) => {
    setPlayerQuizmon({ ...quizmon })

    // Set up AI opponent
    const aiNames = ["Professor Oak", "Elite Four Bruno", "Gym Leader Brock", "Champion Red"]
    const aiQuizmons = STARTER_QUIZMONS.filter((q) => q.id !== quizmon.id)
    const randomAiQuizmon = aiQuizmons[Math.floor(Math.random() * aiQuizmons.length)]

    setAiOpponent((prev) => ({
      ...prev,
      name: aiNames[Math.floor(Math.random() * aiNames.length)],
      quizmon: { ...randomAiQuizmon },
    }))

    setEnemyQuizmon({ ...randomAiQuizmon })
    setGamePhase("training")
  }

  const handleTrainingAnswer = (answerIndex: number) => {
    const question = TRAINING_QUESTIONS[currentQuestion]
    const isCorrect = answerIndex === question.correct

    if (isCorrect && playerQuizmon) {
      // Add 5 skill points randomly to attack or defense
      const statToUpgrade = Math.random() < 0.5 ? "attack" : "defense"
      setPlayerQuizmon((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [statToUpgrade]: prev[statToUpgrade] + 5,
        }
      })
      setQuestionsAnswered((prev) => prev + 1)
      alert(`✅ Correct! +5 ${statToUpgrade} points!`)
    } else {
      alert("❌ Wrong answer! No stat boost.")
    }

    // Next question
    setCurrentQuestion((prev) => (prev + 1) % TRAINING_QUESTIONS.length)
  }

  const startBattle = () => {
    if (!enemyQuizmon) return

    // Give enemy some random stat boosts (simulating their training)
    const enemyBoosts = Math.floor(Math.random() * 10) + 5 // 5-15 boosts
    const boostedEnemy = { ...enemyQuizmon }
    for (let i = 0; i < enemyBoosts; i++) {
      if (Math.random() < 0.5) {
        boostedEnemy.attack += 5
      } else {
        boostedEnemy.defense += 5
      }
    }
    setEnemyQuizmon(boostedEnemy)

    setGamePhase("battle")
    setBattleLog([`⚔️ Battle begins! ${playerQuizmon?.name} vs ${boostedEnemy.name}!`])
  }

  const executeBattleTurn = () => {
    if (!playerQuizmon || !enemyQuizmon) return

    let attacker, defender, isPlayerAttacking

    if (currentTurn === "player") {
      attacker = playerQuizmon
      defender = enemyQuizmon
      isPlayerAttacking = true
    } else {
      attacker = enemyQuizmon
      defender = playerQuizmon
      isPlayerAttacking = false
    }

    // Calculate damage (attack - defense, minimum 1)
    const damage = Math.max(1, attacker.attack - defender.defense)
    const newHp = Math.max(0, defender.hp - damage)

    // Update HP
    if (isPlayerAttacking) {
      setEnemyQuizmon((prev) => (prev ? { ...prev, hp: newHp } : prev))
    } else {
      setPlayerQuizmon((prev) => (prev ? { ...prev, hp: newHp } : prev))
    }

    // Add to battle log
    setBattleLog((prev) => [
      ...prev,
      `${attacker.emoji} ${attacker.name} attacks for ${damage} damage! ${defender.name} HP: ${newHp}/${defender.maxHp}`,
    ])

    // Check for victory
    if (newHp <= 0) {
      setBattleLog((prev) => [...prev, `🏆 ${attacker.name} wins!`])
      setGamePhase("ended")
      return
    }

    // Switch turns
    setCurrentTurn(currentTurn === "player" ? "enemy" : "player")

    if (currentTurn === "enemy") {
      executeAIBattleTurn()
    }
  }

  if (gamePhase === "select") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">⚡ Choose Your Quizmon!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STARTER_QUIZMONS.map((quizmon) => (
                <Card
                  key={quizmon.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => selectQuizmon(quizmon)}
                >
                  <CardContent className="text-center p-4">
                    <div className="text-4xl mb-2">{quizmon.emoji}</div>
                    <h3 className="font-bold">{quizmon.name}</h3>
                    <div className="text-sm text-gray-600 mt-2">
                      <div className="flex items-center justify-center">
                        <Sword className="h-3 w-3 mr-1" />
                        {quizmon.attack}
                      </div>
                      <div className="flex items-center justify-center">
                        <Shield className="h-3 w-3 mr-1" />
                        {quizmon.defense}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gamePhase === "training") {
    const minutes = Math.floor(trainingTimeLeft / 60)
    const seconds = trainingTimeLeft % 60

    return (
      <div className="p-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{playerQuizmon?.emoji}</div>
                <div>
                  <h3 className="font-bold">{playerQuizmon?.name}</h3>
                  <div className="flex space-x-4 text-sm">
                    <span className="flex items-center">
                      <Sword className="h-3 w-3 mr-1" />
                      {playerQuizmon?.attack}
                    </span>
                    <span className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      {playerQuizmon?.defense}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-lg font-bold">
                  <Clock className="h-5 w-5 mr-1" />
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </div>
                <div className="text-sm text-gray-600">Questions: {questionsAnswered}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Training Status */}
        {gamePhase === "training" && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold">🤖 {aiOpponent.name} is training...</h4>
                  <div className="text-sm text-gray-600">
                    Questions: {aiOpponent.questionsAnswered} | Progress: {aiOpponent.trainingProgress}%
                  </div>
                </div>
                <div className="text-2xl">{aiOpponent.quizmon?.emoji}</div>
              </div>
              <Progress value={aiOpponent.trainingProgress} className="mt-2" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🏋️ Training Time!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{TRAINING_QUESTIONS[currentQuestion].text}</p>
            <div className="grid grid-cols-2 gap-3">
              {TRAINING_QUESTIONS[currentQuestion].options.map((option, index) => (
                <Button key={index} variant="outline" onClick={() => handleTrainingAnswer(index)} className="h-12">
                  {option}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">Correct answers give +5 random stat points!</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gamePhase === "battle") {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Player Quizmon */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">{playerQuizmon?.emoji}</div>
              <h3 className="font-bold">{playerQuizmon?.name}</h3>
              <Progress value={((playerQuizmon?.hp || 0) / (playerQuizmon?.maxHp || 1)) * 100} className="mt-2" />
              <div className="text-sm mt-1">
                {playerQuizmon?.hp}/{playerQuizmon?.maxHp} HP
              </div>
              <div className="flex justify-center space-x-4 mt-2 text-sm">
                <span className="flex items-center">
                  <Sword className="h-3 w-3 mr-1" />
                  {playerQuizmon?.attack}
                </span>
                <span className="flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  {playerQuizmon?.defense}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* AI Opponent Quizmon Display */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">{enemyQuizmon?.emoji}</div>
              <h3 className="font-bold">{enemyQuizmon?.name}</h3>
              <div className="text-sm text-gray-600 mb-2">🤖 {aiOpponent.name}'s Partner</div>
              <Progress value={((enemyQuizmon?.hp || 0) / (enemyQuizmon?.maxHp || 1)) * 100} className="mt-2" />
              <div className="text-sm mt-1">
                {enemyQuizmon?.hp}/{enemyQuizmon?.maxHp} HP
              </div>
              <div className="flex justify-center space-x-4 mt-2 text-sm">
                <span className="flex items-center">
                  <Sword className="h-3 w-3 mr-1" />
                  {enemyQuizmon?.attack}
                </span>
                <span className="flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  {enemyQuizmon?.defense}
                </span>
              </div>
              <Badge variant="outline" className="mt-2">
                🤖 {aiOpponent.difficulty} AI
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Battle Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {battleLog.map((log, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  {log}
                </div>
              ))}
            </div>
            <div className="text-center">
              <Button onClick={executeBattleTurn} disabled={gamePhase === "ended"}>
                {currentTurn === "player" ? "Your Attack!" : "Enemy Attack!"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gamePhase === "ended") {
    const winner = playerQuizmon?.hp && playerQuizmon.hp > 0 ? playerQuizmon : enemyQuizmon

    return (
      <Card className="border-yellow-400">
        <CardContent className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">🏆 Battle Complete!</h2>
          <div className="text-6xl mb-4">{winner?.emoji}</div>
          <p className="text-xl mb-4">{winner?.name} wins!</p>
          <Button onClick={() => window.location.reload()}>Battle Again</Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
