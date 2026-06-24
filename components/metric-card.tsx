import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  unit?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
}

export function MetricCard({ title, value, unit, trend, icon }: MetricCardProps) {
  return (
    <div 
      className="relative group rounded-xl p-6 overflow-hidden transition-all duration-500 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.6) 0%, rgba(40, 20, 80, 0.3) 100%)',
        border: '1px solid rgba(136, 100, 255, 0.2)',
        animation: 'border-glow 3s ease-in-out infinite',
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        }}
      />

      {/* Inner glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.1), transparent)',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          </div>
          {icon && (
            <div 
              className="text-cyan-400/60 group-hover:text-cyan-300 transition-colors"
              style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))' }}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 mb-6">
          <span 
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400"
            style={{ animation: 'shimmer 2s ease-in-out infinite' }}
          >
            {value}
          </span>
          {unit && <span className="text-xs text-muted-foreground mb-1">{unit}</span>}
        </div>

        {/* Animated progress bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full"
            style={{
              width: `${Math.min(100, parseInt(value.replace(/[^0-9]/g, '')) / 100)}%`,
              animation: 'gradient-flow 3s ease-in-out infinite',
            }}
          />
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-green-400' : 'text-green-400'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value)}% from last month</span>
          </div>
        )}
      </div>
    </div>
  )
}
