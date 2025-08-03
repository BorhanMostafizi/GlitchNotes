"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Badge } from "@/Components/ui/badge"
import { Progress } from "@/Components/ui/progress"
import { Target, TrendingUp, Award, Calendar } from "lucide-react"

interface WordGoalTrackerProps {
  currentWordCount: number
}

export default function WordGoalTracker({ currentWordCount }: WordGoalTrackerProps) {
  const [dailyGoal, setDailyGoal] = useState(500)
  const [weeklyGoal, setWeeklyGoal] = useState(3500)
  const [dailyProgress, setDailyProgress] = useState(0)
  const [weeklyProgress, setWeeklyProgress] = useState(0)
  const [streak, setStreak] = useState(0)
  const [todayStartCount, setTodayStartCount] = useState(0)
  const [weekStartCount, setWeekStartCount] = useState(0)

  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem("wordGoalTracker")
    if (savedData) {
      const data = JSON.parse(savedData)
      setDailyGoal(data.dailyGoal || 500)
      setWeeklyGoal(data.weeklyGoal || 3500)
      setStreak(data.streak || 0)

      // Check if it's a new day
      const today = new Date().toDateString()
      const lastDate = data.lastDate

      if (lastDate !== today) {
        // New day - reset daily progress
        setTodayStartCount(currentWordCount)
        setDailyProgress(0)

        // Check if it's a new week
        const currentWeek = getWeekNumber(new Date())
        const lastWeek = data.lastWeek

        if (lastWeek !== currentWeek) {
          setWeekStartCount(currentWordCount)
          setWeeklyProgress(0)
        } else {
          setWeekStartCount(data.weekStartCount || currentWordCount)
          setWeeklyProgress(data.weeklyProgress || 0)
        }
      } else {
        setTodayStartCount(data.todayStartCount || currentWordCount)
        setWeekStartCount(data.weekStartCount || currentWordCount)
        setDailyProgress(data.dailyProgress || 0)
        setWeeklyProgress(data.weeklyProgress || 0)
      }
    } else {
      setTodayStartCount(currentWordCount)
      setWeekStartCount(currentWordCount)
    }
  }, [])

  useEffect(() => {
    // Update progress based on current word count
    const newDailyProgress = Math.max(0, currentWordCount - todayStartCount)
    const newWeeklyProgress = Math.max(0, currentWordCount - weekStartCount)

    setDailyProgress(newDailyProgress)
    setWeeklyProgress(newWeeklyProgress)

    // Save to localStorage
    const dataToSave = {
      dailyGoal,
      weeklyGoal,
      dailyProgress: newDailyProgress,
      weeklyProgress: newWeeklyProgress,
      streak,
      todayStartCount,
      weekStartCount,
      lastDate: new Date().toDateString(),
      lastWeek: getWeekNumber(new Date()),
    }
    localStorage.setItem("wordGoalTracker", JSON.stringify(dataToSave))

    // Check for goal completion
    if (newDailyProgress >= dailyGoal && dailyProgress < dailyGoal) {
      // Daily goal achieved!
      setStreak((prev) => prev + 1)
    }
  }, [currentWordCount, todayStartCount, weekStartCount, dailyGoal, weeklyGoal])

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const dailyPercentage = Math.min((dailyProgress / dailyGoal) * 100, 100)
  const weeklyPercentage = Math.min((weeklyProgress / weeklyGoal) * 100, 100)

  const updateDailyGoal = (newGoal: number) => {
    setDailyGoal(newGoal)
    setWeeklyGoal(newGoal * 7) // Auto-update weekly goal
  }

  return (
    <div className="space-y-4">
      {/* Goal Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Writing Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Daily Goal (words)</label>
              <Input
                type="number"
                value={dailyGoal}
                onChange={(e) => updateDailyGoal(Number.parseInt(e.target.value) || 500)}
                min="50"
                max="5000"
                step="50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Weekly Goal (words)</label>
              <Input
                type="number"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number.parseInt(e.target.value) || 3500)}
                min="350"
                max="35000"
                step="350"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </span>
              <Badge variant={dailyProgress >= dailyGoal ? "default" : "outline"}>
                {dailyProgress}/{dailyGoal}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={dailyPercentage} className="mb-2" />
            <div className="text-sm text-gray-600">
              {dailyProgress >= dailyGoal ? (
                <span className="text-green-600 font-medium">🎉 Daily goal achieved!</span>
              ) : (
                <span>{dailyGoal - dailyProgress} words to go</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                This Week
              </span>
              <Badge variant={weeklyProgress >= weeklyGoal ? "default" : "outline"}>
                {weeklyProgress}/{weeklyGoal}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={weeklyPercentage} className="mb-2" />
            <div className="text-sm text-gray-600">
              {weeklyProgress >= weeklyGoal ? (
                <span className="text-green-600 font-medium">🏆 Weekly goal achieved!</span>
              ) : (
                <span>{weeklyGoal - weeklyProgress} words to go</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Counter */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            <span className="font-medium">Current Streak</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">{streak}</div>
            <div className="text-sm text-gray-500">{streak === 1 ? "day" : "days"}</div>
          </div>
        </CardContent>
      </Card>

      {/* Motivational Messages */}
      {dailyProgress > 0 && dailyProgress < dailyGoal && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm text-blue-800">
              <strong>Keep going!</strong> You've written {dailyProgress} words today.
              {dailyPercentage >= 50 ? " You're more than halfway there!" : " Every word counts!"}
            </div>
          </CardContent>
        </Card>
      )}

      {streak >= 3 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-sm text-yellow-800">
              <strong>Amazing streak!</strong> You've hit your daily goal {streak} days in a row. Keep up the fantastic
              work! 🔥
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
