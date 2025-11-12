"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Square, 
  RotateCw, 
  Power, 
  PowerOff,
  RefreshCw,
  Settings,
  Zap,
  Loader2
} from "lucide-react"
import { getServices, startService, stopService, restartService, type Service as ApiService } from "@/lib/api-client"

interface Service {
  id: string
  name: string
  status: "running" | "stopped" | "starting" | "stopping"
  canRestart: boolean
}

export function QuickActionsPanel() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true)
        const apiServices = await getServices()
        // Map API service status to our local status
        const mappedServices: Service[] = apiServices.map(apiService => {
          let status: "running" | "stopped" | "starting" | "stopping" = "stopped"
          if (apiService.status === "operational") {
            status = "running"
          } else if (apiService.status === "degraded") {
            status = "running" // Treat degraded as running for UI purposes
          } else if (apiService.status === "down") {
            status = "stopped"
          }
          
          return {
            id: apiService.id,
            name: apiService.name,
            status,
            canRestart: true, // All services can be restarted
          }
        })
        setServices(mappedServices)
      } catch (err) {
        console.error('Failed to fetch services for quick actions:', err)
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

  const [isStartingAll, setIsStartingAll] = useState(false)
  const [isStoppingAll, setIsStoppingAll] = useState(false)

  const handleServiceAction = async (serviceId: string, action: "start" | "stop" | "restart") => {
    // Update UI immediately
    setServices(prev => prev.map(s => 
      s.id === serviceId 
        ? { ...s, status: action === "start" ? "starting" : action === "stop" ? "stopping" : "starting" }
        : s
    ))
    
    try {
      // Call the actual backend API
      let result;
      if (action === "start") {
        result = await startService(serviceId);
      } else if (action === "stop") {
        result = await stopService(serviceId);
      } else {
        result = await restartService(serviceId);
      }
      
      if (result.success) {
        // Refresh services to get updated status
        const apiServices = await getServices();
        const mappedServices: Service[] = apiServices.map(apiService => {
          let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
          if (apiService.status === "operational") {
            status = "running";
          } else if (apiService.status === "degraded") {
            status = "running";
          } else if (apiService.status === "down") {
            status = "stopped";
          }
          
          return {
            id: apiService.id,
            name: apiService.name,
            status,
            canRestart: true,
          };
        });
        setServices(mappedServices);
      } else {
        // Action failed, revert UI
        const apiServices = await getServices();
        const mappedServices: Service[] = apiServices.map(apiService => {
          let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
          if (apiService.status === "operational") {
            status = "running";
          } else if (apiService.status === "degraded") {
            status = "running";
          } else if (apiService.status === "down") {
            status = "stopped";
          }
          
          return {
            id: apiService.id,
            name: apiService.name,
            status,
            canRestart: true,
          };
        });
        setServices(mappedServices);
        console.error(`Failed to ${action} service ${serviceId}:`, result.message);
      }
    } catch (error) {
      // Error occurred, refresh to get current status
      const apiServices = await getServices();
      const mappedServices: Service[] = apiServices.map(apiService => {
        let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
        if (apiService.status === "operational") {
          status = "running";
        } else if (apiService.status === "degraded") {
          status = "running";
        } else if (apiService.status === "down") {
          status = "stopped";
        }
        
        return {
          id: apiService.id,
          name: apiService.name,
          status,
          canRestart: true,
        };
      });
      setServices(mappedServices);
      console.error(`Error ${action}ing service ${serviceId}:`, error);
    }
  }

  const handleStartAll = async () => {
    setIsStartingAll(true)
    setServices(prev => prev.map(s => ({ ...s, status: "starting" })))
    
    try {
      // Start all services in parallel
      const startPromises = services.map(s => startService(s.id));
      await Promise.all(startPromises);
      
      // Refresh services to get updated status
      const apiServices = await getServices();
      const mappedServices: Service[] = apiServices.map(apiService => {
        let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
        if (apiService.status === "operational") {
          status = "running";
        } else if (apiService.status === "degraded") {
          status = "running";
        } else if (apiService.status === "down") {
          status = "stopped";
        }
        
        return {
          id: apiService.id,
          name: apiService.name,
          status,
          canRestart: true,
        };
      });
      setServices(mappedServices);
    } catch (error) {
      console.error('Error starting all services:', error);
      // Refresh to get current status
      const apiServices = await getServices();
      const mappedServices: Service[] = apiServices.map(apiService => {
        let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
        if (apiService.status === "operational") {
          status = "running";
        } else if (apiService.status === "degraded") {
          status = "running";
        } else if (apiService.status === "down") {
          status = "stopped";
        }
        
        return {
          id: apiService.id,
          name: apiService.name,
          status,
          canRestart: true,
        };
      });
      setServices(mappedServices);
    } finally {
      setIsStartingAll(false);
    }
  }

  const handleStopAll = async () => {
    setIsStoppingAll(true)
    setServices(prev => prev.map(s => ({ ...s, status: "stopping" })))
    
    try {
      // Stop all services in parallel
      const stopPromises = services.map(s => stopService(s.id));
      await Promise.all(stopPromises);
      
      // Refresh services to get updated status
      const apiServices = await getServices();
      const mappedServices: Service[] = apiServices.map(apiService => {
        let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
        if (apiService.status === "operational") {
          status = "running";
        } else if (apiService.status === "degraded") {
          status = "running";
        } else if (apiService.status === "down") {
          status = "stopped";
        }
        
        return {
          id: apiService.id,
          name: apiService.name,
          status,
          canRestart: true,
        };
      });
      setServices(mappedServices);
    } catch (error) {
      console.error('Error stopping all services:', error);
      // Refresh to get current status
      const apiServices = await getServices();
      const mappedServices: Service[] = apiServices.map(apiService => {
        let status: "running" | "stopped" | "starting" | "stopping" = "stopped";
        if (apiService.status === "operational") {
          status = "running";
        } else if (apiService.status === "degraded") {
          status = "running";
        } else if (apiService.status === "down") {
          status = "stopped";
        }
        
        return {
          id: apiService.id,
          name: apiService.name,
          status,
          canRestart: true,
        };
      });
      setServices(mappedServices);
    } finally {
      setIsStoppingAll(false);
    }
  }

  const allRunning = services.every(s => s.status === "running")
  const allStopped = services.every(s => s.status === "stopped")

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading services...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={handleStartAll}
            disabled={isStartingAll || allRunning}
          >
            {isStartingAll ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Start All
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={handleStopAll}
            disabled={isStoppingAll || allStopped}
          >
            {isStoppingAll ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Stop All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border bg-card/50 p-4 hover:bg-card transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-foreground text-sm">{service.name}</p>
              <div className={`h-2 w-2 rounded-full ${
                service.status === "running" ? "bg-emerald-500" :
                service.status === "stopped" ? "bg-gray-500" :
                "bg-amber-500 animate-pulse"
              }`} />
            </div>
            <div className="flex gap-2">
              {service.status === "stopped" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-lg"
                  onClick={() => handleServiceAction(service.id, "start")}
                  disabled={false}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Start
                </Button>
              ) : (
                <>
                  {service.canRestart && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-lg"
                      onClick={() => handleServiceAction(service.id, "restart")}
                      disabled={service.status === "starting" || service.status === "stopping"}
                    >
                      {service.status === "starting" || service.status === "stopping" ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <RotateCw className="h-3.5 w-3.5 mr-1" />
                          Restart
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => handleServiceAction(service.id, "stop")}
                    disabled={service.status === "stopping"}
                  >
                    {service.status === "stopping" ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Square className="h-3.5 w-3.5 mr-1" />
                        Stop
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border/50">
        <Button variant="outline" className="w-full rounded-xl" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Advanced Settings
        </Button>
      </div>
    </Card>
  )
}

