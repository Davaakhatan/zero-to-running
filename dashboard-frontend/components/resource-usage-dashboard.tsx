"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, HardDrive, MemoryStick, Activity, Loader2, AlertCircle } from "lucide-react"
import { getResources } from "@/lib/api-client"

interface ContainerResource {
  name: string
  id: string
  status: string
  cpu: number
  memory: number
  memoryLimit: number
  networkIn: number
  networkOut: number
}

export function ResourceUsageDashboard() {
  const [containers, setContainers] = useState<ContainerResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setError(null)
        const data = await getResources()
        setContainers(data.containers || [])
      } catch (err) {
        console.error('Failed to fetch resources:', err)
        setError(err instanceof Error ? err.message : 'Failed to load resource metrics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResources()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchResources, 10000)
    return () => clearInterval(interval)
  }, [])

  const totalCpu = containers.reduce((sum, c) => sum + c.cpu, 0)
  const totalMemory = containers.reduce((sum, c) => sum + (c.memory || 0), 0) // Already in MB
  const totalMemoryLimit = containers.reduce((sum, c) => sum + (c.memoryLimit || 0), 0) // Already in MB
  const avgMemory = totalMemoryLimit > 0 ? (totalMemory / totalMemoryLimit) * 100 : 0

  const getUsageColor = (value: number) => {
    if (value < 50) return "bg-emerald-500"
    if (value < 80) return "bg-amber-500"
    return "bg-red-500"
  }

  const formatMemory = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading Docker container resources...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-500 mb-4">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">The backend needs Docker socket access to fetch container stats.</p>
          <p>Make sure the backend container has access to the Docker daemon.</p>
        </div>
      </Card>
    )
  }

  if (containers.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-10">
          <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No Docker containers found</p>
          <p className="text-xs text-muted-foreground">Start containers with: <code className="bg-muted px-1.5 py-0.5 rounded">make dev</code></p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Docker Container Resources</h2>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Total CPU</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCpu.toFixed(1)}%</p>
          <Progress value={totalCpu} className="h-1.5 mt-2" />
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Total Memory</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgMemory.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{formatMemory(totalMemory)} / {formatMemory(totalMemoryLimit)}</p>
          <Progress value={avgMemory} className="h-1.5 mt-2" />
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Containers</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{containers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{containers.filter(c => c.status === 'running').length} running</p>
        </div>
      </div>

      {/* Per-Container Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Container Details</h3>
        {containers.map((container) => (
          <div key={container.id} className="rounded-xl border bg-card/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground">{container.name}</p>
                <p className="text-xs text-muted-foreground">ID: {container.id} • Status: {container.status}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">CPU</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{container.cpu.toFixed(1)}%</span>
                </div>
                <Progress value={container.cpu} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Memory</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {container.memoryLimit > 0 ? ((container.memory / container.memoryLimit) * 100).toFixed(1) : '0'}% ({formatMemory(container.memory)} / {formatMemory(container.memoryLimit)})
                  </span>
                </div>
                <Progress value={container.memoryLimit > 0 ? (container.memory / container.memoryLimit) * 100 : 0} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Network</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    ↓ {formatMemory(container.networkIn)} / ↑ {formatMemory(container.networkOut)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getUsageColor((container.networkIn + container.networkOut) / 10)}`}
                    style={{ width: `${Math.min((container.networkIn + container.networkOut) / 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
