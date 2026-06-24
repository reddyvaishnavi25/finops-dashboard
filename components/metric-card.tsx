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
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
        </div>
        {icon && <div className="text-primary opacity-60">{icon}</div>}
      </div>

      <div className="flex items-end gap-2 mb-4">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-1">{unit}</span>}
      </div>

      {trend && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(trend.value)}% from last month</span>
        </div>
      )}
    </div>
  )
}
