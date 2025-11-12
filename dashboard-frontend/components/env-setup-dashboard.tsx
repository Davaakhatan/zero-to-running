"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Settings, Trash2, Loader2, AlertCircle } from "lucide-react"
import { getConfig, getServices, type Config } from "@/lib/api-client"

interface Environment {
  id: string
  name: string
  type: "production" | "staging" | "development"
  status: "active" | "inactive"
  variables: Record<string, string>
}

export function EnvSetupDashboard() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        setError(null)
        const [config, services] = await Promise.all([
          getConfig(),
          getServices(),
        ])
        
        // Build environment variables dynamically from all services
        const variables: Record<string, string> = {
          DATABASE_URL: `postgres://${config.services.database.user}@${config.services.database.host}:${config.services.database.port}/${config.services.database.name}`,
          REDIS_URL: `redis://${config.services.redis.host}:${config.services.redis.port}`,
          BACKEND_URL: `http://${config.services.backend.host}:${config.services.backend.port}`,
        }
        
        // Add all frontend services dynamically
        services.forEach(service => {
          if (service.id === 'app-frontend' || service.id === 'dashboard-frontend' || service.id === 'collabcanva') {
            const serviceName = service.id.toUpperCase().replace(/-/g, '_') + '_URL'
            variables[serviceName] = service.endpoint.replace(/^https?:\/\//, 'http://')
          }
        })
        
        // Build environments from config
        const envs: Environment[] = [
          {
            id: "development",
            name: "Development",
            type: "development",
            status: "active",
            variables,
          },
        ]
        
        setEnvironments(envs)
      } catch (err) {
        console.error('Failed to fetch environments:', err)
        setError(err instanceof Error ? err.message : 'Failed to load environments')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEnvironments()
  }, [])

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusColor = (status: "active" | "inactive") => {
    return status === "active" ? "bg-emerald-500" : "bg-gray-500"
  }

  const getTypeColor = (type: "production" | "staging" | "development") => {
    switch (type) {
      case "production":
        return "bg-red-900 text-red-100"
      case "staging":
        return "bg-orange-900 text-orange-100"
      case "development":
        return "bg-blue-900 text-blue-100"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Environment Setup
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your deployment environments and variables</p>
            </div>
            <Button className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4" />
              Add Environment
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-8 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading environments...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        ) : environments.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No environments configured</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Environment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {environments.map((env) => (
            <Card key={env.id} className="overflow-hidden rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200">
              <div
                className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                onClick={() => setExpandedId(expandedId === env.id ? null : env.id)}
              >
                <div className="flex items-center gap-4">
                  <ChevronDown
                    className={`h-5 w-5 transition-transform text-muted-foreground ${
                      expandedId === env.id ? "rotate-180" : ""
                    }`}
                  />
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(env.status)} shadow-sm`} />
                    <div>
                      <h3 className="font-semibold text-foreground">{env.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{env.type} Environment</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ${getTypeColor(env.type)}`}>{env.type}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === env.id && (
                <div className="border-t border-border/50 bg-muted/20 backdrop-blur-sm px-6 py-5">
                  <div className="space-y-5">
                    <div>
                      <h4 className="mb-4 font-semibold text-foreground text-lg">Environment Variables</h4>
                      <div className="space-y-2.5">
                        {Object.entries(env.variables).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm p-3.5 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="font-mono text-sm">
                              <span className="font-semibold text-accent">{key}</span>
                              <span className="text-muted-foreground"> = </span>
                              <span className="text-muted-foreground">{value}</span>
                            </div>
                            <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:bg-muted/50">
                        <Plus className="h-4 w-4" />
                        Add Variable
                      </Button>
                      <Button variant="outline" size="sm" className="border-border/50 hover:bg-primary/10 hover:text-primary">
                        Deploy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
