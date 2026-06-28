'use client'

import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { WorkspaceDetail } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  tenantId: string
  days: number
}

interface TooltipPayload {
  value: number
  payload: WorkspaceDetail & { cost: number; requests: number }
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

const WS_COLORS = ['#22d3ee', '#a855f7', '#e91e63', '#f59e0b', '#10b981']

export function WorkspaceBreakdownChart({ tenantId, days }: Props) {
  const { data: res } = useSWR<{ data: WorkspaceDetail[] }>(
    tenantId ? `/api/summary/workspaces-detail?tenantId=${tenantId}&days=${days}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const rows = (res?.data ?? []).map(r => ({
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
            Cost by Workspace
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last {days === 1 ? '24h' : `${days} days`}</p>
        </div>

        {!res ? (
          <div className="animate-pulse h-[260px] rounded-lg bg-white/5" />
        ) : (
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
                dataKey="workspace_name"
                width={100}
                stroke="oklch(0.65 0 0)"
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600}>
                {rows.map((_, i) => (
                  <Cell key={i} fill={WS_COLORS[i % WS_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
