"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, HardDrive, MemoryStick, Activity } from "lucide-react"

interface ResourceUsage {
  service: string
  cpu: number
  memory: number
  disk: number
  network: number
}

export function ResourceUsageDashboard() {
  const resources: ResourceUsage[] = [
    { service: "PostgreSQL", cpu: 12, memory: 45, disk: 23, network: 8 },
    { service: "Redis", cpu: 5, memory: 15, disk: 2, network: 12 },
    { service: "Backend API", cpu: 18, memory: 32, disk: 5, network: 15 },
    { service: "Frontend", cpu: 8, memory: 25, disk: 10, network: 5 },
  ]

  const totalCpu = resources.reduce((sum, r) => sum + r.cpu, 0)
  const totalMemory = resources.reduce((sum, r) => sum + r.memory, 0)
  const totalDisk = resources.reduce((sum, r) => sum + r.disk, 0)

  const getUsageColor = (value: number) => {
    if (value < 50) return "bg-emerald-500"
    if (value < 80) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Resource Usage</h2>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Total CPU</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCpu}%</p>
          <Progress value={totalCpu} className="h-1.5 mt-2" />
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Total Memory</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalMemory}%</p>
          <Progress value={totalMemory} className="h-1.5 mt-2" />
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Total Disk</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalDisk}%</p>
          <Progress value={totalDisk} className="h-1.5 mt-2" />
        </div>
      </div>

      {/* Per-Service Breakdown */}
      <div className="space-y-4">
        {resources.map((resource) => (
          <div key={resource.service} className="rounded-xl border bg-card/50 p-4">
            <p className="font-semibold text-foreground mb-4">{resource.service}</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">CPU</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{resource.cpu}%</span>
                </div>
                <Progress value={resource.cpu} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Memory</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{resource.memory}%</span>
                </div>
                <Progress value={resource.memory} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Disk</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{resource.disk}%</span>
                </div>
                <Progress value={resource.disk} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Network</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{resource.network} MB/s</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getUsageColor(resource.network * 10)}`}
                    style={{ width: `${Math.min(resource.network * 10, 100)}%` }}
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

