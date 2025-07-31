"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Code,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BarChart3,
} from "lucide-react"
import DrawingCanvas from "./drawing-canvas"
import ChartGenerator from "./chart-generator"

interface EditorProps {
  initialContent: string
  onContentChange: (content: string) => void
}

export default function Editor({ initialContent, onContentChange }: EditorProps) {
  const [content, setContent] = useState(initialContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showDrawing, setShowDrawing] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [history, setHistory] = useState<string[]>([initialContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedText, setSelectedText] = useState("")

  // Calculate word and character counts
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const characterCount = content.length

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange(newContent)
  }

  // Auto-save functionality
  const handleSave = () => {
    // Auto-save is handled by the parent component
    console.log("Content saved")
  }

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleSave()
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [])

  // Handle text selection
  const handleTextSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const selected = content.substring(start, end)
      setSelectedText(selected)
    }
  }

  // Add to history for undo/redo
  const addToHistory = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      handleContentChange(history[newIndex])
    }
  }

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      handleContentChange(history[newIndex])
    }
  }

  // Insert text at cursor position
  const insertText = (textToInsert: string, wrapSelection = false) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let newText: string
    if (wrapSelection && selectedText) {
      newText = content.substring(0, start) + textToInsert + selectedText + textToInsert + content.substring(end)
    } else {
      newText = content.substring(0, start) + textToInsert + content.substring(end)
    }

    handleContentChange(newText)
    addToHistory(newText)

    // Restore cursor position
    setTimeout(() => {
      if (wrapSelection && selectedText) {
        textarea.setSelectionRange(start + textToInsert.length, end + textToInsert.length)
      } else {
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
      }
      textarea.focus()
    }, 0)
  }

  // Format text with markdown
  const formatText = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", true)
        break
      case "italic":
        insertText("*", true)
        break
      case "underline":
        insertText("<u>", true)
        insertText("</u>", false)
        break
      case "code":
        insertText("`", true)
        break
      case "quote":
        insertText("> ")
        break
      case "list":
        insertText("- ")
        break
      case "orderedList":
        insertText("1. ")
        break
      case "link":
        insertText("[Link Text](https://example.com)")
        break
      case "image":
        insertText("![Alt Text](image-url)")
        break
      case "h1":
        insertText("# ")
        break
      case "h2":
        insertText("## ")
        break
      case "h3":
        insertText("### ")
        break
    }
  }

  // Export content
  const exportContent = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "note.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import content
  const importContent = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const importedContent = e.target?.result as string
        handleContentChange(importedContent)
        addToHistory(importedContent)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="sm" onClick={() => formatText("bold")} title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("italic")} title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("underline")} title="Underline">
                <Underline className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("code")} title="Code">
                <Code className="h-4 w-4" />
              </Button>
            </div>

            {/* Lists and Structure */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="sm" onClick={() => formatText("list")} title="Bullet List">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("orderedList")} title="Numbered List">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("quote")} title="Quote">
                {/* Quote icon here */}
              </Button>
            </div>

            {/* Media */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="sm" onClick={() => formatText("link")} title="Link">
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("image")} title="Image">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Dialog open={showDrawing} onOpenChange={setShowDrawing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Drawing">
                    <Palette className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Drawing Canvas</DialogTitle>
                  </DialogHeader>
                  <DrawingCanvas />
                </DialogContent>
              </Dialog>
              <Dialog open={showCharts} onOpenChange={setShowCharts}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Charts & Graphs">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Chart Generator</DialogTitle>
                  </DialogHeader>
                  <ChartGenerator />
                </DialogContent>
              </Dialog>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="sm" onClick={() => formatText("h1")} title="Heading 1">
                <Type className="h-4 w-4" />
                <span className="text-xs">H1</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("h2")} title="Heading 2">
                <Type className="h-4 w-4" />
                <span className="text-xs">H2</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => formatText("h3")} title="Heading 3">
                <Type className="h-4 w-4" />
                <span className="text-xs">H3</span>
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="sm" title="Align Left">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Align Center">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Align Right">
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            {/* History */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="sm" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* File Operations */}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleSave} title="Save">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={exportContent} title="Export">
                <Download className="h-4 w-4" />
              </Button>
              <label>
                <Button variant="ghost" size="sm" title="Import" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
                <input type="file" accept=".txt,.md" onChange={importContent} className="hidden" />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Editor</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">{wordCount} words</Badge>
              <Badge variant="secondary">{characterCount} characters</Badge>
              {selectedText && <Badge variant="outline">"{selectedText.substring(0, 20)}..." selected</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              handleContentChange(e.target.value)
              addToHistory(e.target.value)
            }}
            onSelect={handleTextSelect}
            placeholder="Start writing your notes here... Use the toolbar above for formatting options."
            className="min-h-[400px] resize-none font-mono"
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => insertText("**Important:** ")}>
              Add Important Note
            </Button>
            <Button variant="outline" size="sm" onClick={() => insertText("TODO: ")}>
              Add TODO
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText(`\n---\n**${new Date().toLocaleDateString()}**\n`)}
            >
              Add Date Separator
            </Button>
            <Button variant="outline" size="sm" onClick={() => insertText("```\n\n```")}>
              Code Block
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText("| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |\n")}
            >
              Table
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
