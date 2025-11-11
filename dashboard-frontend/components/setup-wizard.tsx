"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle, 
  Rocket, 
  Database, 
  Server, 
  Globe,
  Clock,
  Zap
} from "lucide-react"
import { getSetupStatus, type Prerequisite, type SetupStep } from "@/lib/api-client"

export function SetupWizard() {
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([])
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupTime, setSetupTime] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const fetchSetupStatus = async () => {
      try {
        setError(null)
        const status = await getSetupStatus()
        setPrerequisites(status.prerequisites)
        setSetupSteps(status.steps)
        setIsComplete(status.isComplete)
      } catch (err) {
        console.error('Failed to fetch setup status:', err)
        setError(err instanceof Error ? err.message : 'Failed to load setup status')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSetupStatus()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchSetupStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isComplete) {
      const timer = setInterval(() => {
        setSetupTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isComplete])

  const allPrerequisitesMet = prerequisites.length > 0 && prerequisites.every(p => !p.required || p.status === "installed")
  const completedSteps = setupSteps.filter(s => s.status === "completed").length
  const totalSteps = setupSteps.length || 7
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "installed":
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "missing":
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "checking":
      case "in-progress":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "installed":
      case "completed":
        return "text-emerald-600 dark:text-emerald-400"
      case "missing":
      case "failed":
        return "text-red-600 dark:text-red-400"
      case "checking":
      case "in-progress":
        return "text-primary"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Environment Setup
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Getting your development environment ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-8 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading setup status...</span>
            </div>
          </Card>
        ) : (
          <>
            {/* Overall Progress */}
            <Card className="p-6 mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Setup Progress</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(setupTime / 60)}:{(setupTime % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} of {totalSteps} steps completed
            </span>
            <span className="font-semibold text-foreground">{Math.round(progressPercentage)}%</span>
          </div>
        </Card>

        {/* Prerequisites Check */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Prerequisites</h2>
          </div>
          <div className="space-y-3">
            {prerequisites.map((prereq) => (
              <div
                key={prereq.name}
                className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(prereq.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{prereq.name}</p>
                      {prereq.required && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{prereq.description}</p>
                    {prereq.version && (
                      <p className="text-xs text-muted-foreground/60 mt-1">Version: {prereq.version}</p>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(prereq.status)}`}>
                  {prereq.status === "checking" && "Checking..."}
                  {prereq.status === "installed" && "Installed"}
                  {prereq.status === "missing" && "Missing"}
                </span>
              </div>
            ))}
          </div>
          {!allPrerequisitesMet && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please install all required prerequisites before continuing.
              </p>
            </div>
          )}
        </Card>

        {/* Setup Steps */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Setup Steps</h2>
          </div>
          <div className="space-y-3">
            {setupSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  step.status === "in-progress"
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : step.status === "completed"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : step.status === "failed"
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-card/50 border-border/50"
                }`}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <p className="font-semibold text-foreground">{step.name}</p>
                    {step.service && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                        {step.service}
                      </span>
                    )}
                  </div>
                  {step.duration && (
                    <p className="text-xs text-muted-foreground mt-1 ml-9">
                      Completed in {step.duration}s
                    </p>
                  )}
                </div>
                {step.status === "in-progress" && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>In progress...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" className="rounded-xl">
            View Logs
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" disabled={!isComplete}>
              Cancel Setup
            </Button>
            <Button 
              className="rounded-xl shadow-sm hover:shadow-md transition-all" 
              disabled={!allPrerequisitesMet || isComplete}
            >
              {isComplete ? "Setup Complete" : "Start Setup"}
            </Button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

