"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Loader2, AlertCircle } from "lucide-react"
import { getLogs, type LogEntry } from "@/lib/api-client"

interface LogViewerProps {
  isRunning: boolean
}

export function LogViewer({ isRunning }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isRunning) {
      setIsLoading(false)
      return
    }

    const fetchLogs = async () => {
      try {
        setError(null)
        const data = await getLogs({ limit: 50 })
        setLogs(data)
      } catch (err) {
        console.error('Failed to fetch logs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load logs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
    // Auto-refresh every 5 seconds when running
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [isRunning])

  const formatLogMessage = (log: LogEntry) => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString()
    const level = log.level.toUpperCase().padEnd(5)
    return `[${timestamp}] ${level} [${log.service}] ${log.message}${log.details ? ` - ${log.details}` : ''}`
  }

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          System Logs
        </CardTitle>
        <CardDescription>Real-time output from all services</CardDescription>
      </CardHeader>
      <CardContent>
        {!isRunning ? (
          <div className="bg-card border border-border/50 rounded-lg p-4 font-mono text-xs text-muted-foreground">
            [LOG] Waiting for environment startup...<br /><br />
            Run "Start Environment" to begin.
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading logs...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500 py-4">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-lg p-4 font-mono text-xs text-muted-foreground">
            No logs available
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-lg p-4 font-mono text-xs text-foreground/80 overflow-auto max-h-96 space-y-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`hover:text-foreground transition-colors ${
                  log.level === 'error' ? 'text-red-500' :
                  log.level === 'warning' ? 'text-amber-500' :
                  log.level === 'debug' ? 'text-muted-foreground' :
                  'text-muted-foreground'
                }`}
              >
                {formatLogMessage(log)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
