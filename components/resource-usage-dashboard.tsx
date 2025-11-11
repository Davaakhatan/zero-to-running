"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, HardDrive, MemoryStick, Activity, Loader2, AlertCircle } from "lucide-react"
import { getServices, type Service } from "@/lib/api-client"

interface ResourceUsage {
  service: string
  cpu: number
  memory: number
  disk: number
  network: number
}

export function ResourceUsageDashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setError(null)
        const data = await getServices()
        setServices(data)
      } catch (err) {
        console.error('Failed to fetch services for resource usage:', err)
        setError(err instanceof Error ? err.message : 'Failed to load services')
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Resource usage data - in production, this would come from a dedicated /api/resources endpoint
  // For now, show empty state since we don't have real resource metrics
  const resources: ResourceUsage[] = services.map(service => ({
    service: service.name,
    cpu: 0, // Real metrics would come from /api/resources endpoint
    memory: 0,
    disk: 0,
    network: 0,
  })).filter(r => r.service)

  const totalCpu = resources.reduce((sum, r) => sum + r.cpu, 0)
  const totalMemory = resources.reduce((sum, r) => sum + r.memory, 0)
  const totalDisk = resources.reduce((sum, r) => sum + r.disk, 0)

  const getUsageColor = (value: number) => {
    if (value < 50) return "bg-emerald-500"
    if (value < 80) return "bg-amber-500"
    return "bg-red-500"
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading resource usage...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    )
  }

  // Show empty state if no services or all metrics are zero (no real data)
  const hasRealData = resources.some(r => r.cpu > 0 || r.memory > 0 || r.disk > 0 || r.network > 0)
  
  if (resources.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-10">
          <p className="text-muted-foreground">No services available</p>
        </div>
      </Card>
    )
  }

  if (!hasRealData) {
    return (
      <Card className="p-6">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-2">Resource metrics not available</p>
          <p className="text-xs text-muted-foreground">Resource usage data requires a dedicated metrics endpoint</p>
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

