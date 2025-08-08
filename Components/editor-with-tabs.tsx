"use client"

import { useState, useCallback, useEffect } from "react"
import Editor from "./editor"
import NoteTabs from "./note-tabs"
import FlashcardSystem from "./flashcard-system"
import GameModes from "./game-modes"
import PlannerSystem from "./planner-system"
import ForgetMeNotSystem from "./forget-me-not-system"
import DoNotDisturb from "./do-not-disturb"
import LockedMode from "./locked-mode"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"

interface Note {
  id: string
  title: string
  content: string
}

export default function EditorWithTabs() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Untitled Note",
      content: "<p>Welcome to GlitchNotes! Start typing to create your document.</p>",
    },
  ])
  const [activeNoteId, setActiveNoteId] = useState("1")

  // Auto-save functionality
  useEffect(() => {
    const saveToLocalStorage = () => {
      localStorage.setItem(
        "glitchnotes-data",
        JSON.stringify({
          notes,
          activeNoteId,
          lastSaved: new Date().toISOString(),
        }),
      )
    }

    // Save every 10 seconds
    const interval = setInterval(saveToLocalStorage, 10000)

    // Save on page unload
    const handleBeforeUnload = () => {
      saveToLocalStorage()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      saveToLocalStorage() // Save when component unmounts
    }
  }, [notes, activeNoteId])

  // Load data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("glitchnotes-data")
    if (savedData) {
      try {
        const { notes: savedNotes, activeNoteId: savedActiveId } = JSON.parse(savedData)
        if (savedNotes && Array.isArray(savedNotes) && savedNotes.length > 0) {
          setNotes(savedNotes)
          setActiveNoteId(savedActiveId || savedNotes[0].id)
        }
      } catch (error) {
        console.error("Failed to load saved data:", error)
      }
    }
  }, [])

  const activeNote = notes.find((note) => note.id === activeNoteId) || notes[0]

  const handleNoteChange = useCallback((noteId: string) => {
    setActiveNoteId(noteId)
  }, [])

  const handleNoteCreate = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `Note ${notes.length + 1}`,
      content: "<p>Start typing...</p>",
    }
    setNotes((prev) => [...prev, newNote])
    setActiveNoteId(newNote.id)
  }, [notes.length])

  const handleNoteClose = useCallback(
    (noteId: string) => {
      if (notes.length === 1) return // Don't close the last note

      setNotes((prev) => prev.filter((note) => note.id !== noteId))

      if (activeNoteId === noteId) {
        const remainingNotes = notes.filter((note) => note.id !== noteId)
        setActiveNoteId(remainingNotes[0]?.id || "")
      }
    },
    [notes, activeNoteId],
  )

  const handleNoteRename = useCallback((noteId: string, newTitle: string) => {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, title: newTitle } : note)))
  }, [])

  const handleContentChange = useCallback(
    (content: string) => {
      setNotes((prev) => prev.map((note) => (note.id === activeNoteId ? { ...note, content } : note)))
    },
    [activeNoteId],
  )

  return (
    <div className="relative">
      {/* Control Panel */}
      <div className="mb-4 flex justify-end space-x-2">
        <DoNotDisturb />
        <LockedMode />
      </div>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notes">📝 Notes</TabsTrigger>
          <TabsTrigger value="flashcards">🃏 Flashcards</TabsTrigger>
          <TabsTrigger value="games">🎮 Games</TabsTrigger>
          <TabsTrigger value="planner">📅 Planner</TabsTrigger>
          <TabsTrigger value="memory">🧠 Memory</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <div className="relative border border-gray-200 rounded-lg shadow-sm bg-white">
            <NoteTabs
              activeNoteId={activeNoteId}
              notes={notes}
              onNoteChange={handleNoteChange}
              onNoteCreate={handleNoteCreate}
              onNoteClose={handleNoteClose}
              onNoteRename={handleNoteRename}
            />
            <Editor key={activeNoteId} initialContent={activeNote.content} onContentChange={handleContentChange} />
          </div>
        </TabsContent>

        <TabsContent value="flashcards">
          <FlashcardSystem />
        </TabsContent>

        <TabsContent value="games">
          <GameModes />
        </TabsContent>

        <TabsContent value="planner">
          <PlannerSystem />
        </TabsContent>

        <TabsContent value="memory">
          <ForgetMeNotSystem />
        </TabsContent>
      </Tabs>
    </div>
  )
}
