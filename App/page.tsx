"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"
import { Card, CardContent } from "@/ui/card"
import { BookOpen, Gamepad2, PenTool, BarChart3, Calendar, Settings, Lightbulb } from "lucide-react"

import EditorWithTabs from "@/editor-with-tabs"
import GameModes from "@/game-modes"
import DrawingCanvas from "@/drawing-canvas"
import ChartGenerator from "@/chart-generator"
import PlannerSystem from "@/planner-system"
import FlashcardSystem from "@/flashcard-system"
import ForgetMeNotSystem from "@/forget-me-not-system"
import InactivityMonitor from "@/inactivity-monitor"
import LockInTimer from "@/lock-in-timer"
import WordGoalTracker from "@/word-goal-tracker"
import DoNotDisturb from "@/do-not-disturb"
import LockedMode from "@/locked-mode"

export default function Home() {
  const [activeTab, setActiveTab] = useState("editor")
  const [isLocked, setIsLocked] = useState(false)
  const [currentWordCount, setCurrentWordCount] = useState(0)
  const [showTimerComplete, setShowTimerComplete] = useState(false)

  const handleInactivityDetected = () => {
    setIsLocked(true)
  }

  const handleUnlock = () => {
    setIsLocked(false)
  }

  const handleTimerComplete = () => {
    setShowTimerComplete(true)
    setTimeout(() => setShowTimerComplete(false), 5000)
  }

  const handleWordCountChange = (count: number) => {
    setCurrentWordCount(count)
  }

  if (isLocked) {
    return <LockedMode onUnlock={handleUnlock} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Inactivity Monitor */}
      <InactivityMonitor onInactivityDetected={handleInactivityDetected} isLocked={isLocked} />

      {/* Do Not Disturb Mode */}
      <DoNotDisturb />

      {/* Timer Complete Notification */}
      {showTimerComplete && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-green-500 text-white border-green-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div className="font-bold">Focus Session Complete!</div>
              <div className="text-sm">Great job staying focused!</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Anti-Procrastination Editor</h1>
          <p className="text-gray-600">
            Stay focused, productive, and organized with integrated tools for writing, learning, and planning.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <PenTool className="h-4 w-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center space-x-2">
              <Gamepad2 className="h-4 w-4" />
              <span>Games</span>
            </TabsTrigger>
            <TabsTrigger value="drawing" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Drawing</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Charts</span>
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Planner</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <EditorWithTabs onWordCountChange={handleWordCountChange} />
              </div>
              <div className="space-y-4">
                <LockInTimer onTimerComplete={handleTimerComplete} isActive={activeTab === "editor"} />
                <WordGoalTracker currentWordCount={currentWordCount} />
              </div>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Multiplayer Games Coming Soon!</span>
              </div>
              <p className="text-yellow-700 text-sm">
                Among Questions, Quizmon Battles, and multiplayer Clash of Questions are currently in development. Only
                Super Quizio (single-player) is available right now.
              </p>
            </div>
            <GameModes />
          </TabsContent>

          {/* Drawing Tab */}
          <TabsContent value="drawing" className="space-y-6">
            <DrawingCanvas />
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <ChartGenerator />
          </TabsContent>

          {/* Planner Tab */}
          <TabsContent value="planner" className="space-y-6">
            <PlannerSystem />
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FlashcardSystem />
              <ForgetMeNotSystem />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Built to help you stay focused and productive. Take breaks when needed! 🌟</p>
        </div>
      </div>
    </div>
  )
}
