import { ArrowRight, Clock } from 'lucide-react'

interface ApiLog {
  id: string
  tenantName: string
  endpoint: string
  cost: number
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

const mockLogs: ApiLog[] = [
  {
    id: '1',
    tenantName: 'Acme Corp',
    endpoint: '/api/v1/analyze',
    cost: 2.45,
    timestamp: '2 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    tenantName: 'TechStart Inc',
    endpoint: '/api/v1/optimize',
    cost: 1.82,
    timestamp: '5 minutes ago',
    status: 'success',
  },
  {
    id: '3',
    tenantName: 'Global Finance',
    endpoint: '/api/v1/report',
    cost: 3.12,
    timestamp: '8 minutes ago',
    status: 'warning',
  },
  {
    id: '4',
    tenantName: 'CloudScale AI',
    endpoint: '/api/v1/prediction',
    cost: 2.67,
    timestamp: '12 minutes ago',
    status: 'success',
  },
  {
    id: '5',
    tenantName: 'Enterprise Systems',
    endpoint: '/api/v1/batch',
    cost: 4.21,
    timestamp: '15 minutes ago',
    status: 'success',
  },
  {
    id: '6',
    tenantName: 'DataFlow Solutions',
    endpoint: '/api/v1/stream',
    cost: 1.95,
    timestamp: '18 minutes ago',
    status: 'success',
  },
]

export function ApiLogsTable() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Recent Real-Time API Logs</h3>
        <p className="text-sm text-muted-foreground mt-1">Live billing events from cloud infrastructure</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tenant Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                API Endpoint
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cost
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Timestamp
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log, index) => (
              <tr
                key={log.id}
                className={`border-b border-border transition-colors hover:bg-sidebar/40 ${
                  index % 2 === 0 ? 'bg-transparent' : 'bg-sidebar/20'
                }`}
              >
                <td className="py-4 px-4 text-foreground font-medium">{log.tenantName}</td>
                <td className="py-4 px-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <code className="bg-sidebar/60 px-2 py-1 rounded text-xs">{log.endpoint}</code>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                </td>
                <td className="py-4 px-4 text-foreground font-semibold text-green-400">
                  ${log.cost.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    {log.timestamp}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success'
                        ? 'bg-green-400/10 text-green-400'
                        : log.status === 'warning'
                          ? 'bg-yellow-400/10 text-yellow-400'
                          : 'bg-red-400/10 text-red-400'
                    }`}
                  >
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Showing 6 of 2,847 recent logs</p>
        <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
          View All Logs →
        </button>
      </div>
    </div>
  )
}
