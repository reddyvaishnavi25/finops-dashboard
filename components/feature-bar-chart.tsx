'use client'

import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { FeatureUsageSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  tenantId: string
}

interface TooltipPayload {
  value: number
  payload: FeatureUsageSummary & { requests: number }
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg p-3 backdrop-blur-xl border border-cyan-400/30 text-xs"
      style={{
        background: 'linear-gradient(135deg, rgba(20,30,60,0.95) 0%, rgba(40,20,80,0.85) 100%)',
        boxShadow: '0 0 20px rgba(34,211,238,0.15)',
      }}
    >
      <p className="font-semibold text-cyan-300 mb-1">{label}</p>
      <p className="text-green-400">Cost: ${Number(d.value).toFixed(4)}</p>
      <p className="text-muted-foreground">Requests: {d.payload.requests.toLocaleString()}</p>
    </div>
  )
}

export function FeatureBarChart({ tenantId }: Props) {
  const { data: res } = useSWR<{ data: FeatureUsageSummary[] }>(
    tenantId ? `/api/summary/features?tenantId=${tenantId}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const rows = (res?.data ?? []).slice(0, 8).map(r => ({
    ...r,
    cost: Number(r.total_cost),
    requests: Number(r.total_requests),
  }))

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
            Cost by Feature
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Which features are driving spend</p>
        </div>

        {!res ? (
          <div className="animate-pulse h-[260px] rounded-lg bg-white/5" />
        ) : (
          <>
            <defs>
              <linearGradient id="featureGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={rows}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="oklch(0.65 0 0)"
                  tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                  tickFormatter={v => `$${Number(v).toFixed(1)}`}
                />
                <YAxis
                  type="category"
                  dataKey="feature_name"
                  width={130}
                  stroke="oklch(0.65 0 0)"
                  tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill="url(#featureGradient)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}
