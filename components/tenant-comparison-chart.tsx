'use client'

import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TENANT_COLORS = ['#22d3ee', '#a855f7', '#e91e63', '#f59e0b', '#10b981', '#6366f1']

function getColor(idx: number) {
  return TENANT_COLORS[idx % TENANT_COLORS.length]
}

interface Props {
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

export function TenantComparisonChart({ days }: Props) {
  const { data: res } = useSWR<{ data: Record<string, unknown>[] }>(
    `/api/summary/daily-by-tenant?days=${days}`,
    fetcher,
    { refreshInterval: 10000 },
  )

  const rawData = res?.data ?? []
  // Collect names from ALL rows — not just row[0] — so a tenant that had zero
  // spend on the earliest day still gets a Line drawn across the full range.
  const tenants = rawData.length
    ? [...new Set(rawData.flatMap(row => Object.keys(row).filter(k => k !== 'day')))]
    : []

  const formatDay = (val: string) =>
    new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

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
        style={{ background: 'radial-gradient(circle at center, rgba(34,211,238,0.04), transparent)' }}
      />
      <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Daily Spend by Tenant
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Compare burn rate across all clients</p>
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
              {tenants.map((t, i) => (
                <Line
                  key={t}
                  type="monotone"
                  dataKey={t}
                  stroke={getColor(i)}
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
          {tenants.map((t, i) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(i) }} />
              <span className="text-xs text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
