import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface ServiceStatusProps {
  name: string
  status: "running" | "idle" | "error"
  port: string
}

export function ServiceStatus({ name, status, port }: ServiceStatusProps) {
  const statusConfig = {
    running: {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      label: "Running",
    },
    idle: {
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      label: "Idle",
    },
    error: {
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: "Error",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card className="border border-border/50 hover:border-border transition-colors">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground">Port {port}</p>
            </div>
            <div className={`${config.bg} p-2 rounded-lg`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`}></div>
            <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
