"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Save, X, Plus, Trash2, Bell, AlertTriangle } from "lucide-react"

interface ServiceConfig {
  id: string
  serviceName: string
  checkInterval: number
  responseTimeThreshold: number
  uptimeThreshold: number
  alertsEnabled: boolean
  notificationChannels: string[]
}

interface AlertSetting {
  id: string
  name: string
  type: "email" | "slack" | "webhook" | "sms"
  enabled: boolean
  value: string
}

export function ConfigurationPanel() {
  const [configs, setConfigs] = useState<ServiceConfig[]>([
    {
      id: "1",
      serviceName: "API Server",
      checkInterval: 30,
      responseTimeThreshold: 500,
      uptimeThreshold: 99.5,
      alertsEnabled: true,
      notificationChannels: ["email", "slack"],
    },
    {
      id: "2",
      serviceName: "Database",
      checkInterval: 60,
      responseTimeThreshold: 200,
      uptimeThreshold: 99.9,
      alertsEnabled: true,
      notificationChannels: ["email"],
    },
    {
      id: "3",
      serviceName: "Cache Service",
      checkInterval: 45,
      responseTimeThreshold: 300,
      uptimeThreshold: 99.0,
      alertsEnabled: false,
      notificationChannels: [],
    },
  ])

  const [alerts, setAlerts] = useState<AlertSetting[]>([
    {
      id: "1",
      name: "Admin Email",
      type: "email",
      enabled: true,
      value: "admin@example.com",
    },
    {
      id: "2",
      name: "Slack Channel",
      type: "slack",
      enabled: true,
      value: "#alerts",
    },
    {
      id: "3",
      name: "Webhook URL",
      type: "webhook",
      enabled: false,
      value: "https://example.com/webhook",
    },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<ServiceConfig | null>(null)
  const [showNewAlert, setShowNewAlert] = useState(false)

  const startEdit = (config: ServiceConfig) => {
    setEditingId(config.id)
    setEditingConfig({ ...config })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingConfig(null)
  }

  const saveEdit = () => {
    if (editingConfig) {
      setConfigs((prev) => prev.map((c) => (c.id === editingConfig.id ? editingConfig : c)))
      setEditingId(null)
      setEditingConfig(null)
    }
  }

  const updateEditingConfig = (updates: Partial<ServiceConfig>) => {
    if (editingConfig) {
      setEditingConfig({ ...editingConfig, ...updates })
    }
  }

  const toggleAlertChannel = (channel: string) => {
    if (editingConfig) {
      setEditingConfig({
        ...editingConfig,
        notificationChannels: editingConfig.notificationChannels.includes(channel)
          ? editingConfig.notificationChannels.filter((c) => c !== channel)
          : [...editingConfig.notificationChannels, channel],
      })
    }
  }

  const deleteConfig = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id))
  }

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Configuration
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage service monitoring settings and alert preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Service Configurations */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-6">Service Configurations</h2>
            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.id} className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
                  {editingId === config.id && editingConfig ? (
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">{config.serviceName}</h3>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} className="gap-2 shadow-sm hover:shadow-md transition-all">
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="border-border/50 hover:bg-muted/50">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Check Interval (seconds)
                          </label>
                          <input
                            type="number"
                            value={editingConfig.checkInterval}
                            onChange={(e) => updateEditingConfig({ checkInterval: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Response Time Threshold (ms)
                          </label>
                          <input
                            type="number"
                            value={editingConfig.responseTimeThreshold}
                            onChange={(e) => updateEditingConfig({ responseTimeThreshold: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Uptime Threshold (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editingConfig.uptimeThreshold}
                            onChange={(e) => updateEditingConfig({ uptimeThreshold: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-sm"
                          />
                        </div>

                        <div className="border-t border-border pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingConfig.alertsEnabled}
                              onChange={(e) => updateEditingConfig({ alertsEnabled: e.target.checked })}
                              className="rounded border-border"
                            />
                            <span className="text-sm font-medium text-foreground">Enable Alerts</span>
                          </label>

                          {editingConfig.alertsEnabled && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm text-muted-foreground mb-2">Notification Channels</p>
                              {["email", "slack", "webhook"].map((channel) => (
                                <label key={channel} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingConfig.notificationChannels.includes(channel)}
                                    onChange={() => toggleAlertChannel(channel)}
                                    className="rounded border-border"
                                  />
                                  <span className="text-sm text-foreground capitalize">{channel}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground text-lg">{config.serviceName}</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(config)} className="border-border/50 hover:bg-muted/50">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteConfig(config.id)} className="border-border/50 hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Check Interval</p>
                          <p className="font-semibold text-foreground">{config.checkInterval}s</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Response Time</p>
                          <p className="font-semibold text-foreground">{config.responseTimeThreshold}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Uptime Threshold</p>
                          <p className="font-semibold text-foreground">{config.uptimeThreshold}%</p>
                        </div>
                      </div>

                      {config.alertsEnabled && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">
                            Alerts via: {config.notificationChannels.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Alert Channels */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Alert Channels
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full ${alert.enabled ? "bg-emerald-500" : "bg-gray-500"}`} />
                        <h4 className="font-semibold text-foreground">{alert.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 capitalize">{alert.type}</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">{alert.value}</p>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors mt-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-3 pt-3 border-t border-border">
                    <input
                      type="checkbox"
                      checked={alert.enabled}
                      onChange={() => toggleAlert(alert.id)}
                      className="rounded border-border"
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </label>
                </Card>
              ))}

              <Button className="w-full gap-2 mt-4 shadow-sm hover:shadow-md transition-all">
                <Plus className="h-4 w-4" />
                Add Channel
              </Button>
            </div>

            {/* Alert Rules Preview */}
            <Card className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 mt-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-blue-900 dark:text-blue-200 mb-4">Alert Rules</p>
                  <ul className="text-blue-800 dark:text-blue-300 space-y-2.5 text-xs">
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>Service down → Immediate alert</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>Slow response → Warning alert</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>Low uptime → Critical alert</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span>All enabled channels notified</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
