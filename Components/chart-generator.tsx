"use client"

import { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Textarea } from "@/Components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { Badge } from "@/Components/ui/badge"
import { Trash2, Plus, BarChart3, LineChart, BarChart2, Table } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface DataPoint {
  id: string
  label: string
  value: number
  color?: string
}

interface ChartConfig {
  title: string
  type: "bar" | "line" | "histogram" | "table"
  data: DataPoint[]
  xAxisLabel: string
  yAxisLabel: string
  colors: string[]
}

const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
  "#00ffff",
  "#ff0000",
  "#0000ff",
  "#ffff00",
]

export default function ChartGenerator() {
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [currentChart, setCurrentChart] = useState<ChartConfig>({
    title: "",
    type: "bar",
    data: [],
    xAxisLabel: "X Axis",
    yAxisLabel: "Y Axis",
    colors: DEFAULT_COLORS,
  })
  const [newDataPoint, setNewDataPoint] = useState({ label: "", value: "" })
  const [bulkData, setBulkData] = useState("")

  const addDataPoint = () => {
    if (newDataPoint.label && newDataPoint.value) {
      const value = Number.parseFloat(newDataPoint.value)
      if (!isNaN(value)) {
        setCurrentChart((prev) => ({
          ...prev,
          data: [
            ...prev.data,
            {
              id: Date.now().toString(),
              label: newDataPoint.label,
              value: value,
              color: DEFAULT_COLORS[prev.data.length % DEFAULT_COLORS.length],
            },
          ],
        }))
        setNewDataPoint({ label: "", value: "" })
      }
    }
  }

  const removeDataPoint = (id: string) => {
    setCurrentChart((prev) => ({
      ...prev,
      data: prev.data.filter((point) => point.id !== id),
    }))
  }

  const processBulkData = () => {
    const lines = bulkData.trim().split("\n")
    const newData: DataPoint[] = []

    lines.forEach((line, index) => {
      const parts = line.split(",").map((part) => part.trim())
      if (parts.length >= 2) {
        const label = parts[0]
        const value = Number.parseFloat(parts[1])
        if (!isNaN(value)) {
          newData.push({
            id: `bulk_${Date.now()}_${index}`,
            label,
            value,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          })
        }
      }
    })

    setCurrentChart((prev) => ({
      ...prev,
      data: [...prev.data, ...newData],
    }))
    setBulkData("")
  }

  const saveChart = () => {
    if (currentChart.title && currentChart.data.length > 0) {
      setCharts((prev) => [...prev, { ...currentChart, id: Date.now().toString() } as any])
      setCurrentChart({
        title: "",
        type: "bar",
        data: [],
        xAxisLabel: "X Axis",
        yAxisLabel: "Y Axis",
        colors: DEFAULT_COLORS,
      })
    }
  }

  const deleteChart = (index: number) => {
    setCharts((prev) => prev.filter((_, i) => i !== index))
  }

  const renderChart = (chart: ChartConfig) => {
    const data = chart.data.map((point) => ({
      name: point.label,
      value: point.value,
      fill: point.color,
    }))

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case "histogram":
        // For histogram, we'll group data into bins
        const sortedData = [...data].sort((a, b) => a.value - b.value)
        const binCount = Math.min(10, Math.max(3, Math.ceil(Math.sqrt(data.length))))
        const min = Math.min(...data.map((d) => d.value))
        const max = Math.max(...data.map((d) => d.value))
        const binWidth = (max - min) / binCount

        const bins = Array.from({ length: binCount }, (_, i) => ({
          name: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
          value: 0,
          fill: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        }))

        data.forEach((point) => {
          const binIndex = Math.min(binCount - 1, Math.floor((point.value - min) / binWidth))
          bins[binIndex].value++
        })

        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bins}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {bins.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">{chart.xAxisLabel}</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">{chart.yAxisLabel}</th>
                </tr>
              </thead>
              <tbody>
                {chart.data.map((point, index) => (
                  <tr key={point.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border border-gray-300 px-4 py-2">{point.label}</td>
                    <td className="border border-gray-300 px-4 py-2">{point.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Chart Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Chart</TabsTrigger>
              <TabsTrigger value="view">View Charts ({charts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Chart Title</Label>
                  <Input
                    id="title"
                    value={currentChart.title}
                    onChange={(e) => setCurrentChart((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chart title"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Chart Type</Label>
                  <Select
                    value={currentChart.type}
                    onValueChange={(value: any) => setCurrentChart((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">
                        <div className="flex items-center">
                          <BarChart2 className="h-4 w-4 mr-2" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
                        <div className="flex items-center">
                          <LineChart className="h-4 w-4 mr-2" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="histogram">
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Histogram
                        </div>
                      </SelectItem>
                      <SelectItem value="table">
                        <div className="flex items-center">
                          <Table className="h-4 w-4 mr-2" />
                          Table
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="xAxis">X-Axis Label</Label>
                  <Input
                    id="xAxis"
                    value={currentChart.xAxisLabel}
                    onChange={(e) => setCurrentChart((prev) => ({ ...prev, xAxisLabel: e.target.value }))}
                    placeholder="X-axis label"
                  />
                </div>

                <div>
                  <Label htmlFor="yAxis">Y-Axis Label</Label>
                  <Input
                    id="yAxis"
                    value={currentChart.yAxisLabel}
                    onChange={(e) => setCurrentChart((prev) => ({ ...prev, yAxisLabel: e.target.value }))}
                    placeholder="Y-axis label"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Add Data Points</h4>

                <div className="flex space-x-2">
                  <Input
                    value={newDataPoint.label}
                    onChange={(e) => setNewDataPoint((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newDataPoint.value}
                    onChange={(e) => setNewDataPoint((prev) => ({ ...prev, value: e.target.value }))}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button onClick={addDataPoint}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label htmlFor="bulkData">Bulk Data (CSV format: label,value per line)</Label>
                  <Textarea
                    id="bulkData"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="Apple,10&#10;Banana,15&#10;Orange,8"
                    rows={3}
                  />
                  <Button onClick={processBulkData} className="mt-2" disabled={!bulkData.trim()}>
                    Add Bulk Data
                  </Button>
                </div>

                {currentChart.data.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Current Data Points:</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {currentChart.data.map((point) => (
                        <div key={point.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>
                            {point.label}: {point.value}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeDataPoint(point.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {currentChart.data.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="border rounded-lg p-4">
                    <h5 className="text-center font-medium mb-4">{currentChart.title || "Chart Preview"}</h5>
                    {renderChart(currentChart)}
                  </div>
                </div>
              )}

              <Button
                onClick={saveChart}
                className="w-full"
                disabled={!currentChart.title || currentChart.data.length === 0}
              >
                Save Chart
              </Button>
            </TabsContent>

            <TabsContent value="view" className="space-y-4">
              {charts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No charts created yet. Create your first chart in the "Create Chart" tab.
                </div>
              ) : (
                <div className="space-y-6">
                  {charts.map((chart, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            {chart.type === "bar" && <BarChart2 className="h-5 w-5 mr-2" />}
                            {chart.type === "line" && <LineChart className="h-5 w-5 mr-2" />}
                            {chart.type === "histogram" && <BarChart3 className="h-5 w-5 mr-2" />}
                            {chart.type === "table" && <Table className="h-5 w-5 mr-2" />}
                            {chart.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">{chart.type}</Badge>
                            <Badge variant="outline">{chart.data.length} data points</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteChart(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>{renderChart(chart)}</CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
