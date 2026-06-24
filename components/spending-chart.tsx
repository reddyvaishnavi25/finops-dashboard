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
      <div 
        className="rounded-lg p-3 backdrop-blur-xl border border-cyan-400/30"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.9) 0%, rgba(40, 20, 80, 0.7) 100%)',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)',
        }}
      >
        <p className="text-xs text-cyan-300 font-medium">{label}</p>
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
    <div 
      className="rounded-xl p-6 overflow-hidden relative group"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.5) 0%, rgba(40, 20, 80, 0.2) 100%)',
        border: '1px solid rgba(136, 100, 255, 0.15)',
        animation: 'border-glow 4s ease-in-out infinite',
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.05), transparent)',
        }}
      />

      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Monthly Spending Trends
          </h3>
          <p className="text-xs text-muted-foreground mt-1">12-month historical and forecasted costs</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(1 0 0 / 5%)"
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
              stroke="#e91e63"
              strokeWidth={3}
              dot={{ fill: '#e91e63', r: 4, opacity: 0.8 }}
              isAnimationActive={true}
              name="Actual Spend"
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#00e5ff"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#00e5ff', r: 3, opacity: 0.6 }}
              isAnimationActive={true}
              name="Forecast"
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex gap-8 mt-6 pt-4 border-t border-cyan-400/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500/80 animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Actual Spend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400/60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span className="text-xs text-muted-foreground">Forecast</span>
          </div>
        </div>
      </div>
    </div>
  )
}
