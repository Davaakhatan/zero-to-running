"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, AlertCircle, CheckCircle2, Circle, RotateCw, TrendingUp, Zap } from "lucide-react"

interface Service {
  id: string
  name: string
  endpoint: string
  status: "operational" | "degraded" | "down"
  responseTime: number
  uptime: number
  lastChecked: Date
}

export function ServiceStatusMonitor() {
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: "API Server",
      endpoint: "https://api.example.com/health",
      status: "operational",
      responseTime: 45,
      uptime: 99.98,
      lastChecked: new Date(),
    },
    {
      id: "2",
      name: "Database",
      endpoint: "https://db.example.com/health",
      status: "operational",
      responseTime: 12,
      uptime: 99.99,
      lastChecked: new Date(),
    },
    {
      id: "3",
      name: "Cache Service",
      endpoint: "https://cache.example.com/health",
      status: "degraded",
      responseTime: 234,
      uptime: 98.5,
      lastChecked: new Date(),
    },
    {
      id: "4",
      name: "Auth Service",
      endpoint: "https://auth.example.com/health",
      status: "operational",
      responseTime: 78,
      uptime: 99.97,
      lastChecked: new Date(),
    },
    {
      id: "5",
      name: "Storage Service",
      endpoint: "https://storage.example.com/health",
      status: "down",
      responseTime: 0,
      uptime: 95.2,
      lastChecked: new Date(),
    },
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const getStatusIcon = (status: "operational" | "degraded" | "down") => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "down":
        return <Circle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBgColor = (status: "operational" | "degraded" | "down") => {
    switch (status) {
      case "operational":
        return "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/30"
      case "degraded":
        return "bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/30"
      case "down":
        return "bg-red-500/5 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/30"
    }
  }

  const getStatusTextColor = (status: "operational" | "degraded" | "down") => {
    switch (status) {
      case "operational":
        return "text-emerald-700 dark:text-emerald-300"
      case "degraded":
        return "text-amber-700 dark:text-amber-300"
      case "down":
        return "text-red-700 dark:text-red-300"
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Update all lastChecked times
    setServices((prev) =>
      prev.map((service) => ({
        ...service,
        lastChecked: new Date(),
      })),
    )
    setIsRefreshing(false)
  }

  const formatLastChecked = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const operationalCount = services.filter((s) => s.status === "operational").length
  const degradedCount = services.filter((s) => s.status === "degraded").length
  const downCount = services.filter((s) => s.status === "down").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Service Status Monitor
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Real-time health checks and performance metrics</p>
              </div>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing} 
              className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 shadow-sm hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Operational</p>
                  </div>
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{operationalCount}</p>
                  <div className="mt-3 h-1.5 w-24 bg-emerald-500/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(operationalCount / services.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/20 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6 shadow-sm hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Degraded</p>
                  </div>
                  <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{degradedCount}</p>
                  <div className="mt-3 h-1.5 w-24 bg-amber-500/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(degradedCount / services.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/20 group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 shadow-sm hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Down</p>
                  </div>
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">{downCount}</p>
                  <div className="mt-3 h-1.5 w-24 bg-red-500/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(downCount / services.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-500/20 group-hover:scale-110 transition-transform">
                  <Circle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl group ${getStatusBgColor(service.status)}`}
            >
              <div className="px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative p-3 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm group-hover:shadow-md transition-all">
                      {getStatusIcon(service.status)}
                      {service.status === "operational" && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
                      )}
                      {service.status === "operational" && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{service.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">{service.endpoint}</p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize shadow-sm ${getStatusTextColor(service.status)} bg-background/90 backdrop-blur-sm border border-border/50`}
                  >
                    {service.status}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-background/80 backdrop-blur-sm p-4 border border-border/50 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Response Time</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <p className="text-2xl font-bold text-foreground">{service.responseTime}</p>
                      <p className="text-xs text-muted-foreground font-medium">ms</p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          service.responseTime < 50 ? 'bg-emerald-500' : 
                          service.responseTime < 200 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((service.responseTime / 500) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-background/80 backdrop-blur-sm p-4 border border-border/50 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uptime</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <p className="text-2xl font-bold text-foreground">{service.uptime}</p>
                      <p className="text-xs text-muted-foreground font-medium">%</p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          service.uptime >= 99.9 ? 'bg-emerald-500' : 
                          service.uptime >= 99 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${service.uptime}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-background/80 backdrop-blur-sm p-4 border border-border/50 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Checked</p>
                    </div>
                    <p className="text-sm font-bold text-foreground mb-2">{formatLastChecked(service.lastChecked)}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs text-muted-foreground">Live</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
