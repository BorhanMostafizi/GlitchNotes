"use client"

import { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Card, CardContent } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Plus, X, FileText, Edit3 } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  lastModified: Date
}

interface NoteTabsProps {
  notes: Note[]
  activeNoteId: string | null
  onNoteSelect: (noteId: string) => void
  onNoteCreate: (title: string) => void
  onNoteDelete: (noteId: string) => void
  onNoteRename: (noteId: string, newTitle: string) => void
}

export default function NoteTabs({
  notes,
  activeNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  onNoteRename,
}: NoteTabsProps) {
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [showNewNoteInput, setShowNewNoteInput] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const handleCreateNote = () => {
    if (newNoteTitle.trim()) {
      onNoteCreate(newNoteTitle.trim())
      setNewNoteTitle("")
      setShowNewNoteInput(false)
    }
  }

  const handleRenameNote = (noteId: string) => {
    if (editingTitle.trim()) {
      onNoteRename(noteId, editingTitle.trim())
      setEditingNoteId(null)
      setEditingTitle("")
    }
  }

  const startRenaming = (note: Note) => {
    setEditingNoteId(note.id)
    setEditingTitle(note.title)
  }

 const formatLastModified = (date?: Date | null) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "Unknown"
  }

  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return date.toLocaleDateString()
}

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
        {notes.map((note) => (
          <div key={note.id} className="flex items-center group">
            <Button
              variant={activeNoteId === note.id ? "default" : "outline"}
              size="sm"
              onClick={() => onNoteSelect(note.id)}
              className="flex items-center space-x-2 min-w-0 max-w-48"
            >
              <FileText className="h-3 w-3 flex-shrink-0" />
              {editingNoteId === note.id ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleRenameNote(note.id)}
                  onKeyPress={(e) => e.key === "Enter" && handleRenameNote(note.id)}
                  className="h-6 text-xs px-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span className="truncate cursor-pointer" onDoubleClick={() => startRenaming(note)} title={note.title}>
                  {note.title}
                </span>
              )}
            </Button>

            {notes.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNoteDelete(note.id)}
                className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {/* New Note Button/Input */}
        {showNewNoteInput ? (
          <div className="flex items-center space-x-2">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateNote()}
              onBlur={() => {
                if (!newNoteTitle.trim()) {
                  setShowNewNoteInput(false)
                }
              }}
              placeholder="Note title..."
              className="h-8 text-xs w-32"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewNoteInput(true)}
            className="flex items-center space-x-1"
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </Button>
        )}
      </div>

      {/* Note Info */}
      {activeNoteId && (
        <div className="mb-4">
          {(() => {
            const activeNote = notes.find((n) => n.id === activeNoteId)
            if (!activeNote) return null

            return (
              <Card className="bg-gray-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{activeNote.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {activeNote.content.split(/\s+/).filter((word) => word.length > 0).length} words
                      </Badge>
                      <span className="text-xs text-gray-500">{formatLastModified(activeNote.lastModified)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const activeNote = notes.find((n) => n.id === activeNoteId)
            if (activeNote) {
              startRenaming(activeNote)
            }
          }}
          disabled={!activeNoteId}
        >
          <Edit3 className="h-3 w-3 mr-1" />
          Rename
        </Button>

        <Button variant="outline" size="sm" onClick={() => onNoteCreate(`Note ${notes.length + 1}`)}>
          <Plus className="h-3 w-3 mr-1" />
          Quick Add
        </Button>
      </div>

      {/* Instructions */}
      {notes.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-700 mb-2">No notes yet!</p>
            <p className="text-xs text-blue-600">
              Click "New" to create your first note, or use "Quick Add" for a default name.
            </p>
          </CardContent>
        </Card>
      )}

      {notes.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-3">
            <p className="text-xs text-gray-600">
              💡 <strong>Tips:</strong> Double-click a tab to rename it. Use Ctrl+N for new notes. Switch between notes
              to organize your thoughts!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
