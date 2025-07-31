"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Brush, Eraser, Palette, Download, Trash2, Undo, Redo, Circle, Square, Minus } from "lucide-react"

interface DrawingCanvasProps {
  width?: number
  height?: number
}

interface DrawingState {
  imageData: ImageData | null
  timestamp: number
}

export default function DrawingCanvas({ width = 800, height = 600 }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<"brush" | "eraser" | "line" | "circle" | "rectangle">("brush")
  const [brushSize, setBrushSize] = useState(5)
  const [color, setColor] = useState("#000000")
  const [history, setHistory] = useState<DrawingState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize canvas
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, width, height)

    // Save initial state
    saveState()
  }, [width, height])

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, width, height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ imageData, timestamp: Date.now() })

    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      restoreState(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      restoreState(historyIndex + 1)
    }
  }

  const restoreState = (index: number) => {
    const canvas = canvasRef.current
    if (!canvas || !history[index]) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.putImageData(history[index].imageData, 0, 0)
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    setStartPos(pos)
    setIsDrawing(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = brushSize

    if (tool === "brush") {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pos = getMousePos(e)

    if (tool === "brush" || tool === "eraser") {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (tool === "line" || tool === "circle" || tool === "rectangle") {
      // For shapes, we need to redraw from the last saved state
      if (history[historyIndex]) {
        ctx.putImageData(history[historyIndex].imageData, 0, 0)
      }

      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize

      if (tool === "line") {
        ctx.beginPath()
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))
        ctx.beginPath()
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (tool === "rectangle") {
        const width = pos.x - startPos.x
        const height = pos.y - startPos.y
        ctx.beginPath()
        ctx.rect(startPos.x, startPos.y, width, height)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveState()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, width, height)
    saveState()
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `drawing-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Drawing Canvas
          </span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{tool.charAt(0).toUpperCase() + tool.slice(1)}</Badge>
            <Badge variant="outline">Size: {brushSize}px</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tool === "brush" ? "default" : "outline"} size="sm" onClick={() => setTool("brush")}>
            <Brush className="h-4 w-4 mr-1" />
            Brush
          </Button>
          <Button variant={tool === "eraser" ? "default" : "outline"} size="sm" onClick={() => setTool("eraser")}>
            <Eraser className="h-4 w-4 mr-1" />
            Eraser
          </Button>
          <Button variant={tool === "line" ? "default" : "outline"} size="sm" onClick={() => setTool("line")}>
            <Minus className="h-4 w-4 mr-1" />
            Line
          </Button>
          <Button variant={tool === "circle" ? "default" : "outline"} size="sm" onClick={() => setTool("circle")}>
            <Circle className="h-4 w-4 mr-1" />
            Circle
          </Button>
          <Button variant={tool === "rectangle" ? "default" : "outline"} size="sm" onClick={() => setTool("rectangle")}>
            <Square className="h-4 w-4 mr-1" />
            Rectangle
          </Button>
        </div>

        {/* Colors */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Color:</span>
          <div className="flex space-x-1">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded border-2 ${color === c ? "border-gray-800" : "border-gray-300"}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Brush Size */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Size:</span>
          <div className="flex-1 max-w-48">
            <Slider value={[brushSize]} onValueChange={(value) => setBrushSize(value[0])} min={1} max={50} step={1} />
          </div>
          <span className="text-sm text-gray-500 w-8">{brushSize}px</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4 mr-1" />
            Redo
          </Button>
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={downloadImage}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="drawing-canvas cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Select a tool and color, then click and drag to draw</li>
            <li>Use the eraser to remove parts of your drawing</li>
            <li>Shape tools: click and drag to create lines, circles, or rectangles</li>
            <li>Adjust brush size with the slider</li>
            <li>Use Undo/Redo to navigate your drawing history</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
