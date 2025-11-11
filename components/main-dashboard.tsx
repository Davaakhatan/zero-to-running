"use client"

import { useState } from "react"
import { LogViewerHealthChecks } from "@/components/log-viewer-health-checks"
import { ServiceStatusMonitor } from "@/components/service-status-monitor"
import { ConfigurationPanel } from "@/components/configuration-panel"
import { EnvSetupDashboard } from "@/components/env-setup-dashboard"
import { SetupWizard } from "@/components/setup-wizard"
import { ServiceDependencyGraph } from "@/components/service-dependency-graph"
import { QuickActionsPanel } from "@/components/quick-actions-panel"
import { ResourceUsageDashboard } from "@/components/resource-usage-dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Activity, 
  Settings, 
  FileText, 
  Rocket,
  Network,
  Zap,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

type View = 
  | "setup" 
  | "dashboard" 
  | "services" 
  | "logs" 
  | "config" 
  | "environments"
  | "dependencies"
  | "resources"

export function MainDashboard() {
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [showSidebar, setShowSidebar] = useState(true)

  const views = [
    { id: "setup" as View, name: "Setup", icon: Rocket },
    { id: "dashboard" as View, name: "Dashboard", icon: LayoutDashboard },
    { id: "services" as View, name: "Services", icon: Activity },
    { id: "logs" as View, name: "Logs & Health", icon: FileText },
    { id: "config" as View, name: "Configuration", icon: Settings },
    { id: "environments" as View, name: "Environments", icon: Network },
    { id: "dependencies" as View, name: "Dependencies", icon: Network },
    { id: "resources" as View, name: "Resources", icon: BarChart3 },
  ]

  const renderView = () => {
    switch (currentView) {
      case "setup":
        return <SetupWizard />
      case "dashboard":
        return (
          <div className="min-h-screen bg-background">
            <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
              <div className="mx-auto max-w-7xl px-8 py-6">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Overview of your development environment</p>
              </div>
            </div>
            <div className="mx-auto max-w-7xl px-8 py-10 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ServiceDependencyGraph />
                <QuickActionsPanel />
              </div>
              <ResourceUsageDashboard />
            </div>
          </div>
        )
      case "services":
        return <ServiceStatusMonitor />
      case "logs":
        return <LogViewerHealthChecks />
      case "config":
        return <ConfigurationPanel />
      case "environments":
        return <EnvSetupDashboard />
      case "dependencies":
        return (
          <div className="mx-auto max-w-4xl px-8 py-10">
            <ServiceDependencyGraph />
          </div>
        )
      case "resources":
        return (
          <div className="mx-auto max-w-4xl px-8 py-10">
            <ResourceUsageDashboard />
          </div>
        )
      default:
        return <ServiceStatusMonitor />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r bg-card/50 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Dev Environment</h1>
                <p className="text-xs text-muted-foreground">Zero-to-Running</p>
              </div>
            </div>
            <nav className="space-y-1">
              {views.map((view) => {
                const Icon = view.icon
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      currentView === view.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {view.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Sidebar Toggle Button */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="rounded-lg"
              aria-label="Toggle sidebar"
            >
              {showSidebar ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        {renderView()}
      </div>
    </div>
  )
}

