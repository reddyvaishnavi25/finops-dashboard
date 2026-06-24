'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', spend: 4200, forecast: 4100 },
  { month: 'Feb', spend: 4800, forecast: 4500 },
  { month: 'Mar', spend: 4200, forecast: 4400 },
  { month: 'Apr', spend: 5100, forecast: 5000 },
  { month: 'May', spend: 4900, forecast: 5100 },
  { month: 'Jun', spend: 5400, forecast: 5300 },
  { month: 'Jul', spend: 5200, forecast: 5400 },
  { month: 'Aug', spend: 5800, forecast: 5600 },
  { month: 'Sep', spend: 6100, forecast: 6000 },
  { month: 'Oct', spend: 5900, forecast: 6200 },
  { month: 'Nov', spend: 6300, forecast: 6400 },
  { month: 'Dec', spend: 6500, forecast: 6600 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: ${entry.value}k
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function SpendingChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Monthly Spending Trends</h3>
        <p className="text-sm text-muted-foreground mt-1">12-month historical and forecasted costs</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(1 0 0 / 8%)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="oklch(0.65 0 0)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'oklch(0.65 0 0)' }}
          />
          <YAxis
            stroke="oklch(0.65 0 0)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'oklch(0.65 0 0)' }}
            label={{ value: 'Cost ($k)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="spend"
            stroke="oklch(0.55 0.2 264)"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            name="Actual Spend"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="oklch(0.65 0.15 120)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
            name="Forecast"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex gap-6 mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs text-muted-foreground">Actual Spend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-3" style={{ opacity: 0.6 }}></div>
          <span className="text-xs text-muted-foreground">Forecast</span>
        </div>
      </div>
    </div>
  )
}
