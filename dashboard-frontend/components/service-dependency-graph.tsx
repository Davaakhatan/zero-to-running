"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Database, Server, Globe, Zap, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { getServices, type Service as ApiService } from "@/lib/api-client"

interface Service {
  id: string
  name: string
  type: "database" | "cache" | "api" | "frontend"
  status: "operational" | "degraded" | "down"
  dependencies: string[]
}

export function ServiceDependencyGraph() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const apiServices = await getServices()
        
        // Map API services to our graph format
        const mappedServices: Service[] = apiServices.map(apiService => {
          let type: "database" | "cache" | "api" | "frontend" = "api"
          let dependencies: string[] = []

          if (apiService.id === "database") {
            type = "database"
            dependencies = []
          } else if (apiService.id === "cache") {
            type = "cache"
            dependencies = []
          } else if (apiService.id === "api-server") {
            type = "api"
            dependencies = ["database", "cache"]
          } else if (apiService.id === "app-frontend") {
            type = "frontend"
            dependencies = ["api-server"]
          }

          return {
            id: apiService.id,
            name: apiService.name,
            type,
            status: apiService.status,
            dependencies,
          }
        })

        setServices(mappedServices)
      } catch (err) {
        console.error('Failed to fetch services for dependency graph:', err)
        setError(err instanceof Error ? err.message : 'Failed to load services')
        setServices([]) // Show empty state instead of mock data
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServices, 30000)
    return () => clearInterval(interval)
  }, [])

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

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading dependencies...</span>
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

  if (services.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-10">
          <p className="text-muted-foreground">No services available</p>
        </div>
      </Card>
    )
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

