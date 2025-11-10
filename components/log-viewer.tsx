import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface LogViewerProps {
  isRunning: boolean
}

export function LogViewer({ isRunning }: LogViewerProps) {
  const logs = isRunning
    ? [
        "[12:34:05] Starting PostgreSQL database...",
        "[12:34:06] Database initialized successfully",
        "[12:34:07] Starting Redis cache server...",
        "[12:34:08] Redis cache running on port 6379",
        "[12:34:09] Starting backend API server...",
        "[12:34:11] API server listening on port 3001",
        "[12:34:12] Starting frontend dev server...",
        "[12:34:14] Frontend running on port 3000",
        "[12:34:15] All services initialized successfully",
      ]
    : ['[LOG] Waiting for environment startup...\n\nRun "Start Environment" to begin.']

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
        <div className="bg-card border border-border/50 rounded-lg p-4 font-mono text-xs text-foreground/80 overflow-auto max-h-96 space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="text-muted-foreground hover:text-foreground transition-colors">
              {log}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
