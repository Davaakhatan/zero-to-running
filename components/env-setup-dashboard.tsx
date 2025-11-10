"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Settings, Trash2 } from "lucide-react"

interface Environment {
  id: string
  name: string
  type: "production" | "staging" | "development"
  status: "active" | "inactive"
  variables: Record<string, string>
}

export function EnvSetupDashboard() {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: "1",
      name: "Production",
      type: "production",
      status: "active",
      variables: {
        DATABASE_URL: "postgres://prod.db.example.com",
        API_KEY: "••••••••••••••••",
        NEXT_PUBLIC_API_URL: "https://api.example.com",
      },
    },
    {
      id: "2",
      name: "Staging",
      type: "staging",
      status: "active",
      variables: {
        DATABASE_URL: "postgres://staging.db.example.com",
        API_KEY: "••••••••••••••••",
        NEXT_PUBLIC_API_URL: "https://staging-api.example.com",
      },
    },
    {
      id: "3",
      name: "Development",
      type: "development",
      status: "active",
      variables: {
        DATABASE_URL: "postgres://localhost:5432/dev",
        API_KEY: "••••••••••••••••",
        NEXT_PUBLIC_API_URL: "http://localhost:3000",
      },
    },
  ])

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
      </div>
    </div>
  )
}
