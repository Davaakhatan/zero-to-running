"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Search, CheckCircle2, AlertCircle, XCircle, Clock, TrendingUp, Activity, Loader2 } from "lucide-react"
import { getLogs, getDetailedHealth, type LogEntry as ApiLogEntry, type HealthCheck as ApiHealthCheck } from "@/lib/api-client"

interface HealthCheck {
  id: string
  service: string
  timestamp: Date
  status: "passed" | "warning" | "failed"
  responseTime: number
  details: string
}

interface LogEntry {
  id: string
  timestamp: Date
  level: "info" | "warning" | "error" | "debug"
  service: string
  message: string
  details?: string
}

export function LogViewerHealthChecks() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [logLevelFilter, setLogLevelFilter] = useState<string | null>(null)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setError(null)
      
      // Map service display names to backend service names for filtering
      const serviceNameMap: Record<string, string> = {
        'Database': 'Database',
        'Cache Service': 'Cache Service',
        'API Server': 'API Server',
        'Application Frontend': 'Application Frontend',
        'Dashboard Frontend': 'Dashboard Frontend',
      };
      
      // Fetch logs with service filter if selected
      // Map service display name to backend service name for filtering
      let backendServiceName: string | undefined = undefined;
      if (selectedService) {
        // Direct mapping for exact matches
        backendServiceName = serviceNameMap[selectedService] || selectedService;
        console.log('[Logs] Filtering by service:', selectedService, '->', backendServiceName);
      } else {
        console.log('[Logs] Showing all services (no filter)');
      }
      
      const logsData = await getLogs({ 
        limit: 50,
        service: backendServiceName,
      })
      const logsWithDates: LogEntry[] = logsData.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }))
      setLogs(logsWithDates)

      // Fetch health checks
      const healthData = await getDetailedHealth() as any
      const checks: HealthCheck[] = []
      
      // Convert health check data to our format
      // ALWAYS show all 5 services - Database, Cache, API Server, App Frontend, Dashboard Frontend
      // Remove ALL conditional checks - always add all 5 services
      const deps = healthData?.dependencies || {}
      
      // 1. Database health check (ALWAYS add)
      const dbDep = deps.database
      const dbStatus = dbDep?.status === 'healthy' ? 'passed' : 
                      dbDep?.status === 'unhealthy' ? 'failed' : 'warning'
      checks.push({
        id: 'database',
        service: 'Database',
        timestamp: new Date(healthData.timestamp),
        status: dbStatus,
        responseTime: dbDep?.details?.responseTime || 0,
        details: dbDep?.details?.error || 
                `Connection ${dbDep?.status || 'unknown'}, response time: ${dbDep?.details?.responseTime || 0}ms`,
      })

      // 2. Redis health check (ALWAYS add)
      const redisDep = deps.redis
      const redisStatus = redisDep?.status === 'healthy' ? 'passed' : 
                        redisDep?.status === 'unhealthy' ? 'failed' : 'warning'
      checks.push({
        id: 'redis',
        service: 'Cache Service',
        timestamp: new Date(healthData.timestamp),
        status: redisStatus,
        responseTime: redisDep?.details?.responseTime || 0,
        details: redisDep?.details?.error || 
                `Connection ${redisDep?.status || 'unknown'}, response time: ${redisDep?.details?.responseTime || 0}ms`,
      })

      // 3. App Frontend health check (ALWAYS add - no conditional)
      const appFrontendDep = deps['app-frontend']
      const appFrontendStatus = appFrontendDep?.status === 'healthy' ? 'passed' : 
                               appFrontendDep?.status === 'unhealthy' ? 'failed' : 'warning'
      checks.push({
        id: 'app-frontend',
        service: 'Application Frontend',
        timestamp: new Date(healthData.timestamp),
        status: appFrontendStatus,
        responseTime: appFrontendDep?.details?.responseTime || 0,
        details: appFrontendDep?.details?.error || 
                `Service ${appFrontendDep?.status || 'unknown'}, response time: ${appFrontendDep?.details?.responseTime || 0}ms`,
      })

      // 4. Dashboard Frontend health check (ALWAYS add - no conditional)
      const dashboardFrontendDep = deps['dashboard-frontend']
      const dashboardFrontendStatus = dashboardFrontendDep?.status === 'healthy' ? 'passed' : 
                                     dashboardFrontendDep?.status === 'unhealthy' ? 'failed' : 'warning'
      checks.push({
        id: 'dashboard-frontend',
        service: 'Dashboard Frontend',
        timestamp: new Date(healthData.timestamp),
        status: dashboardFrontendStatus,
        responseTime: dashboardFrontendDep?.details?.responseTime || 0,
        details: dashboardFrontendDep?.details?.error || 
                `Service ${dashboardFrontendDep?.status || 'unknown'}, response time: ${dashboardFrontendDep?.details?.responseTime || 0}ms`,
      })

      // 5. Backend API health check (ALWAYS add)
      checks.push({
        id: 'api-server',
        service: 'API Server',
        timestamp: new Date(healthData.timestamp),
        status: healthData.status === 'healthy' ? 'passed' : 
                healthData.status === 'degraded' ? 'warning' : 'failed',
        responseTime: healthData.responseTime || 0,
        details: `Backend API is ${healthData.status}`,
      })
      
      // Debug logging - ALWAYS log to help debug
      console.log('=== HEALTH CHECKS DEBUG ===')
      console.log('[Health Checks] Received healthData:', healthData)
      console.log('[Health Checks] Dependencies object:', deps)
      console.log('[Health Checks] Dependencies keys:', Object.keys(deps))
      console.log('[Health Checks] app-frontend exists:', 'app-frontend' in deps)
      console.log('[Health Checks] dashboard-frontend exists:', 'dashboard-frontend' in deps)
      console.log('[Health Checks] Total checks created:', checks.length)
      console.log('[Health Checks] Services:', checks.map(c => `${c.id}: ${c.service}`))
      console.log('===========================')
      
      // Ensure we always have exactly 5 services
      if (checks.length !== 5) {
        console.error(`[Health Checks] ERROR: Expected 5 services, got ${checks.length}!`)
        console.error('[Health Checks] Services found:', checks.map(c => c.service))
        console.error('[Health Checks] Missing services:', 
          ['database', 'redis', 'app-frontend', 'dashboard-frontend', 'api-server']
            .filter(id => !checks.find(c => c.id === id))
            .map(id => id)
        )
      }
      
      setHealthChecks(checks)
    } catch (err) {
      console.error('Failed to fetch logs and health checks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchData()
    
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      console.log('[Auto-Refresh] Refreshing data...')
      fetchData()
    }, 5000)
    
    console.log('[Auto-Refresh] Started auto-refresh interval (5 seconds)')
    
    return () => {
      console.log('[Auto-Refresh] Stopping auto-refresh interval')
      clearInterval(interval)
    }
  }, [selectedService])

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "info":
        return "bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/30"
      case "warning":
        return "bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/30"
      case "error":
        return "bg-red-500/5 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/30"
      case "debug":
        return "bg-muted/30 border-border/50"
      default:
        return "bg-card border-border"
    }
  }

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return "text-blue-600 dark:text-blue-400"
      case "warning":
        return "text-amber-600 dark:text-amber-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      case "debug":
        return "text-muted-foreground"
      default:
        return "text-foreground"
    }
  }

  const getHealthCheckIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = !logLevelFilter || log.level === logLevelFilter
    // Service filter is already applied in fetchData, but keep it here for safety
    const matchesService = !selectedService || log.service === selectedService

    return matchesSearch && matchesLevel && matchesService
  })

  const passedChecks = healthChecks.filter((c) => c.status === "passed").length
  const warningChecks = healthChecks.filter((c) => c.status === "warning").length
  const failedChecks = healthChecks.filter((c) => c.status === "failed").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Logs & Health Checks
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Monitor service health status and system logs in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-8 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading logs and health checks...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Health Checks Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Health Checks</h2>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center backdrop-blur-sm relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{passedChecks}</p>
                  </div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Passed</p>
                  <p className="text-xs text-muted-foreground mt-1">({healthChecks.length} total)</p>
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center backdrop-blur-sm relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{warningChecks}</p>
                  </div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Warning</p>
                </div>
              </div>
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center backdrop-blur-sm relative overflow-hidden group hover:scale-105 transition-transform duration-200">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedChecks}</p>
                  </div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Failed</p>
                </div>
              </div>
            </div>

            {/* Health Checks List */}
            <div className="space-y-3">
              {healthChecks.length === 0 && (
                <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
                  No health checks available
                </div>
              )}
              {healthChecks.map((check) => {
                // Use the service name directly for filtering
                const logServiceName = check.service
                const isSelected = selectedService === logServiceName
                
                return (
                <div 
                  key={check.id} 
                  onClick={() => {
                    if (isSelected) {
                      setSelectedService(null) // Deselect if clicking again
                    } else {
                      setSelectedService(logServiceName) // Filter to this service
                    }
                  }}
                  className={`rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 group cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative mt-0.5 p-1.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                      {getHealthCheckIcon(check.status)}
                      {check.status === "passed" && (
                        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight">{check.service}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTime(check.timestamp)}</p>
                    </div>
                  </div>
                  <div className="ml-10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Response:</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              check.responseTime < 50 ? 'bg-emerald-500' : 
                              check.responseTime < 200 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((check.responseTime / 500) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground bg-muted px-2 py-1 rounded-md text-xs">{check.responseTime}ms</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{check.details}</p>
                    {isSelected && (
                      <p className="text-xs text-primary font-medium mt-2">✓ Showing logs for this service</p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Logs Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">System Logs</h2>
              {selectedService && (
                <span className="text-sm text-primary font-medium">(Filtered: {selectedService})</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">Auto-refreshing every 5s</span>
            </div>

            {/* Filter Controls */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search logs by service or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={logLevelFilter === null ? "default" : "outline"}
                  onClick={() => setLogLevelFilter(null)}
                  className="rounded-lg"
                >
                  All
                </Button>
                {["info", "warning", "error", "debug"].map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={logLevelFilter === level ? "default" : "outline"}
                    onClick={() => setLogLevelFilter(level)}
                    className="capitalize rounded-lg"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Logs List */}
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg group ${getLogLevelColor(log.level)}`}
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`relative p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 ${getLogLevelIcon(log.level)}`}>
                        <Clock className="h-4 w-4" />
                        {log.level === "error" && (
                          <>
                            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-ping" />
                            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border shadow-sm transition-all ${
                            log.level === "error" ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400" :
                            log.level === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" :
                            log.level === "info" ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" :
                            "bg-muted border-border/50 text-foreground"
                          }`}>
                            {log.level}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">{log.service}</span>
                          <span className="text-xs text-muted-foreground/60 ml-auto flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground break-words leading-snug text-sm">{log.message}</p>

                        {expandedLogId === log.id && log.details && (
                          <div className="mt-4 pt-4 border-t border-border/50 bg-background/80 backdrop-blur-sm p-4 rounded-lg text-xs font-mono text-foreground/90">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="rounded-xl border bg-card p-12">
                  <div className="text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-muted/50 mb-4">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-foreground font-medium mb-1">No logs matching your filters</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
