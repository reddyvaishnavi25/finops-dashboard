'use client'

import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export const PROVIDER_COLORS: Record<string, string> = {
  OpenAI:    '#e91e63',
  Anthropic: '#a855f7',
  AWS:       '#22d3ee',
  GCP:       '#f59e0b',
}
export const FALLBACK_COLORS = ['#10b981', '#6366f1', '#ec4899', '#84cc16']

function getColor(provider: string, idx: number) {
  return PROVIDER_COLORS[provider] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
}

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
      className="rounded-lg p-3 backdrop-blur-xl border border-cyan-400/30 text-xs"
      style={{
        background: 'linear-gradient(135deg, rgba(20,30,60,0.95) 0%, rgba(40,20,80,0.85) 100%)',
        boxShadow: '0 0 20px rgba(34,211,238,0.15)',
      }}
    >
      <p className="text-cyan-300 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: ${Number(p.value).toFixed(4)}
        </p>
      ))}
    </div>
  )
}

export function ProviderTrendChart({ tenantId, days }: Props) {
  const { data: res } = useSWR<{ data: Record<string, unknown>[] }>(
    tenantId ? `/api/summary/providers-trend?tenantId=${tenantId}&days=${days}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const rawData = res?.data ?? []
  const providers = rawData.length
    ? Object.keys(rawData[0]).filter(k => k !== 'day')
    : []

  const formatDay = (val: string) =>
    new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      className="rounded-xl p-6 overflow-hidden relative group h-full"
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
        <div className="mb-4">
          <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Provider Cost Trends
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Daily spend per AI provider</p>
        </div>

        {!res ? (
          <div className="animate-pulse h-[260px] rounded-lg bg-white/5" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rawData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={formatDay}
                stroke="oklch(0.65 0 0)"
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="oklch(0.65 0 0)"
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                tickFormatter={v => `$${Number(v).toFixed(1)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {providers.map((p, i) => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={getColor(p, i)}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={600}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-cyan-400/10">
          {providers.map((p, i) => (
            <div key={p} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: getColor(p, i) }} />
              <span className="text-xs text-muted-foreground">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
