"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Plus, Trash2, Repeat } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  date: string
  time?: string
  repetition: "none" | "daily" | "weekly" | "monthly"
  repetitionDays?: number[] // 0-6 for Sunday-Saturday
  createdAt: Date
}

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: Date
  startTime?: string
  endTime?: string
  type: "event" | "task" | "reminder"
}

export default function PlannerSystem() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    time: "",
    repetition: "none" as const,
    repetitionDays: [] as number[],
  })
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    type: "event" as const,
  })
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "year">("day")

  // Load data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("planner-tasks")
    const savedEvents = localStorage.getItem("planner-events")

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
    if (savedEvents) {
      setCalendarEvents(
        JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          date: new Date(event.date),
        })),
      )
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("planner-tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("planner-events", JSON.stringify(calendarEvents))
  }, [calendarEvents])

  const addTask = () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      completed: false,
      date: selectedDate.toISOString().split("T")[0],
      time: newTask.time || undefined,
      repetition: newTask.repetition,
      repetitionDays: newTask.repetitionDays,
      createdAt: new Date(),
    }

    setTasks((prev) => [...prev, task])
    setNewTask({
      title: "",
      description: "",
      time: "",
      repetition: "none",
      repetitionDays: [],
    })

    // Create recurring tasks if needed
    if (task.repetition !== "none") {
      createRecurringTasks(task)
    }
  }

  const createRecurringTasks = (baseTask: Task) => {
    const recurringTasks: Task[] = []
    const startDate = new Date(baseTask.date)

    for (let i = 1; i <= 30; i++) {
      // Create 30 instances
      const nextDate = new Date(startDate)

      if (baseTask.repetition === "daily") {
        nextDate.setDate(startDate.getDate() + i)
      } else if (baseTask.repetition === "weekly") {
        nextDate.setDate(startDate.getDate() + i * 7)
      } else if (baseTask.repetition === "monthly") {
        nextDate.setMonth(startDate.getMonth() + i)
      }

      // Check if this day should have the task (for weekly repetition with specific days)
      if (baseTask.repetition === "weekly" && baseTask.repetitionDays && baseTask.repetitionDays.length > 0) {
        if (!baseTask.repetitionDays.includes(nextDate.getDay())) {
          continue
        }
      }

      recurringTasks.push({
        ...baseTask,
        id: `${baseTask.id}-${i}`,
        date: nextDate.toISOString().split("T")[0],
        completed: false,
      })
    }

    setTasks((prev) => [...prev, ...recurringTasks])
  }

  const toggleTask = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const addEvent = () => {
    if (!newEvent.title.trim()) return

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: selectedDate,
      startTime: newEvent.startTime || undefined,
      endTime: newEvent.endTime || undefined,
      type: newEvent.type,
    }

    setCalendarEvents((prev) => [...prev, event])
    setNewEvent({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      type: "event",
    })
  }

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return tasks.filter((task) => task.date === dateStr)
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return calendarEvents.filter((event) => event.date.toISOString().split("T")[0] === dateStr)
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Planner System</h2>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">📅 Calendar</TabsTrigger>
          <TabsTrigger value="tasks">✅ Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {/* View Mode Selector */}
          <div className="flex justify-between items-center">
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-lg font-semibold">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Events and Schedule */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Schedule for {selectedDate.toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Event Form */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Add Event</h4>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Event title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <Select
                      value={newEvent.type}
                      onValueChange={(value: any) => setNewEvent((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">📅 Event</SelectItem>
                        <SelectItem value="task">✅ Task</SelectItem>
                        <SelectItem value="reminder">⏰ Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      type="time"
                      placeholder="Start time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                    <Input
                      type="time"
                      placeholder="End time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                    className="mb-2"
                  />
                  <Button onClick={addEvent} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </div>

                {/* Events List */}
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{event.title}</h5>
                          {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Badge variant="outline" className="mr-2">
                              {event.type === "event" ? "📅" : event.type === "task" ? "✅" : "⏰"}
                              {event.type}
                            </Badge>
                            {event.startTime && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(event.startTime)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarEvents((prev) => prev.filter((e) => e.id !== event.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getEventsForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No events scheduled for this day</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Task Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  type="time"
                  value={newTask.time}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, time: e.target.value }))}
                />

                <div>
                  <label className="text-sm font-medium mb-2 block">Repetition</label>
                  <Select
                    value={newTask.repetition}
                    onValueChange={(value: any) => setNewTask((prev) => ({ ...prev, repetition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No repetition</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newTask.repetition === "weekly" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Repeat on days:</label>
                    <div className="flex gap-2">
                      {dayNames.map((day, index) => (
                        <Button
                          key={index}
                          variant={newTask.repetitionDays.includes(index) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setNewTask((prev) => ({
                              ...prev,
                              repetitionDays: prev.repetitionDays.includes(index)
                                ? prev.repetitionDays.filter((d) => d !== index)
                                : [...prev.repetitionDays, index],
                            }))
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={addTask} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </CardContent>
            </Card>

            {/* Tasks for Selected Date */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks for {selectedDate.toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getTasksForDate(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-3 ${task.completed ? "bg-green-50 border-green-200" : "bg-white"}`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h5 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                            {task.title}
                          </h5>
                          {task.description && (
                            <p className={`text-sm mt-1 ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            {task.time && (
                              <span className="flex items-center mr-3">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(task.time)}
                              </span>
                            )}
                            {task.repetition !== "none" && (
                              <span className="flex items-center">
                                <Repeat className="h-3 w-3 mr-1" />
                                {task.repetition}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getTasksForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No tasks for this day</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
