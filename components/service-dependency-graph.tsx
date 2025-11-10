"use client"

import { Card } from "@/components/ui/card"
import { Database, Server, Globe, Zap, ArrowRight } from "lucide-react"

interface Service {
  id: string
  name: string
  type: "database" | "cache" | "api" | "frontend"
  status: "operational" | "degraded" | "down"
  dependencies: string[]
}

export function ServiceDependencyGraph() {
  const services: Service[] = [
    {
      id: "postgresql",
      name: "PostgreSQL",
      type: "database",
      status: "operational",
      dependencies: [],
    },
    {
      id: "redis",
      name: "Redis",
      type: "cache",
      status: "operational",
      dependencies: [],
    },
    {
      id: "backend",
      name: "Backend API",
      type: "api",
      status: "operational",
      dependencies: ["postgresql", "redis"],
    },
    {
      id: "frontend",
      name: "Frontend",
      type: "frontend",
      status: "operational",
      dependencies: ["backend"],
    },
  ]

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "database":
        return <Database className="h-5 w-5" />
      case "cache":
        return <Zap className="h-5 w-5" />
      case "api":
        return <Server className="h-5 w-5" />
      case "frontend":
        return <Globe className="h-5 w-5" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "border-emerald-500/30 bg-emerald-500/10"
      case "degraded":
        return "border-amber-500/30 bg-amber-500/10"
      case "down":
        return "border-red-500/30 bg-red-500/10"
      default:
        return "border-border bg-card"
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Service Dependencies</h2>
      </div>
      
      <div className="space-y-6">
        {services.map((service, index) => (
          <div key={service.id} className="relative">
            {/* Service Card */}
            <div className={`rounded-xl border p-4 ${getStatusColor(service.status)}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50">
                  {getServiceIcon(service.type)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{service.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  {service.dependencies.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Depends on {service.dependencies.length} service{service.dependencies.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dependency Arrows */}
            {service.dependencies.length > 0 && (
              <div className="flex items-center gap-2 mt-2 ml-4">
                {service.dependencies.map((depId, depIndex) => {
                  const depService = services.find(s => s.id === depId)
                  return (
                    <div key={depId} className="flex items-center gap-2">
                      {depIndex > 0 && <span className="text-muted-foreground">+</span>}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span>{depService?.name || depId}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <p className="text-sm font-medium text-foreground mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Down</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

