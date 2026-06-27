'use client'

import useSWR from 'swr'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailySummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  tenantId: string
  days: number
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg p-3 backdrop-blur-xl border border-cyan-400/30"
      style={{
        background: 'linear-gradient(135deg, rgba(20,30,60,0.9) 0%, rgba(40,20,80,0.7) 100%)',
        boxShadow: '0 0 20px rgba(34,211,238,0.2)',
      }}
    >
      <p className="text-xs text-cyan-300 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: ${Number(entry.value).toFixed(4)}
        </p>
      ))}
    </div>
  )
}

export function SpendingChart({ tenantId, days }: Props) {
  const { data: res } = useSWR<{ data: DailySummary[] }>(
    tenantId ? `/api/summary/daily?tenantId=${tenantId}&days=${days}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const chartData = (res?.data ?? []).map(d => ({
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: Number(d.total_cost),
    requests: Number(d.total_requests),
  }))

  return (
    <div
      className="rounded-xl p-6 overflow-hidden relative group"
      style={{
        background: 'linear-gradient(135deg, rgba(20,30,60,0.5) 0%, rgba(40,20,80,0.2) 100%)',
        border: '1px solid rgba(136,100,255,0.15)',
        animation: 'border-glow 4s ease-in-out infinite',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(168,85,247,0.05), transparent)' }}
      />
      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Daily Spending Trend
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Total cost per day across all providers</p>
        </div>

        {!res ? (
          <div className="animate-pulse h-[300px] rounded-lg bg-white/5" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="oklch(0.65 0 0)"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'oklch(0.65 0 0)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="oklch(0.65 0 0)"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'oklch(0.65 0 0)' }}
                tickFormatter={v => `$${Number(v).toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#e91e63"
                strokeWidth={3}
                dot={false}
                isAnimationActive={true}
                name="Daily Cost"
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="flex gap-8 mt-6 pt-4 border-t border-cyan-400/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500/80 animate-pulse" />
            <span className="text-xs text-muted-foreground">Daily Cost</span>
          </div>
        </div>
      </div>
    </div>
  )
}
