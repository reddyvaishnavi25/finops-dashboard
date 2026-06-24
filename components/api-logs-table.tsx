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
  const getStatusStyle = (status: 'success' | 'warning' | 'error') => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 500,
      animation: 'status-pulse 2s ease-in-out infinite',
      border: 'none',
    }

    if (status === 'success') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
        color: '#22c55e',
        boxShadow: '0 0 10px rgba(34, 197, 94, 0.3), inset 0 0 10px rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
      }
    } else if (status === 'warning') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.05) 100%)',
        color: '#eab308',
        boxShadow: '0 0 10px rgba(234, 179, 8, 0.3), inset 0 0 10px rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
      }
    }
    return {
      ...baseStyle,
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
      color: '#ef4444',
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    }
  }

  return (
    <div 
      className="rounded-xl p-6 overflow-hidden relative group"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.4) 0%, rgba(40, 20, 80, 0.15) 100%)',
        border: '1px solid rgba(136, 100, 255, 0.15)',
        animation: 'border-glow 5s ease-in-out infinite',
      }}
    >
      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Recent Real-Time API Logs
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Live billing events from cloud infrastructure</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyan-400/10">
                <th className="text-left py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Tenant Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  API Endpoint
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Cost
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className="border-b border-cyan-400/5 transition-all duration-300 hover:bg-cyan-400/5 group/row"
                  style={{
                    background: index % 2 === 0 ? 'transparent' : 'rgba(34, 211, 238, 0.02)',
                  }}
                >
                  <td className="py-4 px-4 text-foreground font-medium group-hover/row:text-cyan-300 transition-colors">
                    {log.tenantName}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <code 
                        className="px-2 py-1 rounded text-xs transition-all"
                        style={{
                          background: 'rgba(168, 85, 247, 0.1)',
                          color: '#c084fc',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.endpoint}
                      </code>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/50 group-hover/row:text-cyan-300/50 transition-colors" />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-foreground font-semibold text-green-400">
                    ${log.cost.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground group-hover/row:text-cyan-300/70 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span style={getStatusStyle(log.status)}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-cyan-400/10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing 6 of 2,847 recent logs</p>
          <button 
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all duration-300 hover:gap-2 flex items-center gap-1"
            style={{
              textShadow: 'none',
            }}
          >
            View All Logs
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
