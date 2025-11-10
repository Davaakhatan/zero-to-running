export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  service: string;
  message: string;
  details?: string;
}

interface LogFilters {
  service?: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  limit?: number;
  since?: Date;
}

// Mock log storage - will be replaced with actual log aggregation from K8s
const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    level: 'info',
    service: 'API Server',
    message: 'Health check passed',
    details: 'Response time: 45ms',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    level: 'warning',
    service: 'Cache Service',
    message: 'Slow response detected',
    details: 'Response time: 234ms (threshold: 200ms)',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    level: 'error',
    service: 'Storage Service',
    message: 'Service unavailable',
    details: 'Connection timeout after 30s',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    level: 'info',
    service: 'Database',
    message: 'Health check passed',
    details: 'Response time: 12ms',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    level: 'debug',
    service: 'Auth Service',
    message: 'Cache hit rate: 95%',
    details: 'Total requests: 1,234',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    level: 'warning',
    service: 'API Server',
    message: 'High error rate detected',
    details: 'Error rate: 2.5% (threshold: 1%)',
  },
];

export async function getLogs(filters: LogFilters): Promise<LogEntry[]> {
  let logs = [...mockLogs];

  // Filter by service
  if (filters.service) {
    logs = logs.filter(log => 
      log.service.toLowerCase().includes(filters.service!.toLowerCase())
    );
  }

  // Filter by level
  if (filters.level) {
    logs = logs.filter(log => log.level === filters.level);
  }

  // Filter by time
  if (filters.since) {
    logs = logs.filter(log => new Date(log.timestamp) >= filters.since!);
  }

  // Sort by timestamp (newest first)
  logs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply limit
  if (filters.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
}

