'use client'

import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Cpu, DollarSign } from 'lucide-react'
import type { ModelSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  tenantId: string
}

interface TooltipPayload {
  value: number
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
      <p className="font-semibold text-cyan-300 mb-1">{label}</p>
      <p className="text-green-400">Cost: ${Number(payload[0].value).toFixed(4)}</p>
    </div>
  )
}

const MODEL_COLORS = ['#a855f7', '#22d3ee', '#e91e63', '#f59e0b', '#10b981', '#6366f1']

export function ModelBreakdownSection({ tenantId }: Props) {
  const { data: res } = useSWR<{ data: ModelSummary[] }>(
    tenantId ? `/api/summary/models?tenantId=${tenantId}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const rows = res?.data ?? []
  const mostCostly = rows[0]
  const mostUsed = [...rows].sort((a, b) => Number(b.total_requests) - Number(a.total_requests))[0]

  const chartData = rows.slice(0, 6).map(r => ({
    model_name: r.model_name.replace('claude-', 'claude/').replace('gpt-', 'gpt/'),
    cost: Number(r.total_cost),
  }))

  return (
    <div
      className="rounded-xl p-6 overflow-hidden relative group h-full flex flex-col"
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
      <div className="relative z-10 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Model Breakdown
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cost and usage by AI model</p>
        </div>

        {!res ? (
          <div className="animate-pulse flex-1 rounded-lg bg-white/5" />
        ) : (
          <>
            {/* Highlight boxes */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.25)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Most Costly</span>
                </div>
                <p className="text-sm font-bold text-purple-300 truncate" title={mostCostly?.model_name}>
                  {mostCostly?.model_name ?? '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ${Number(mostCostly?.total_cost ?? 0).toFixed(2)} total
                </p>
              </div>
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(34,211,238,0.06)',
                  border: '1px solid rgba(34,211,238,0.2)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Most Used</span>
                </div>
                <p className="text-sm font-bold text-cyan-300 truncate" title={mostUsed?.model_name}>
                  {mostUsed?.model_name ?? '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {Number(mostUsed?.total_requests ?? 0).toLocaleString()} requests
                </p>
              </div>
            </div>

            {/* Bar chart */}
            {chartData.length > 0 && (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="oklch(0.65 0 0)"
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
                      tickFormatter={v => `$${Number(v).toFixed(0)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="model_name"
                      width={90}
                      stroke="oklch(0.65 0 0)"
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
