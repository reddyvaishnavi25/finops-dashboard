'use client'

import useSWR from 'swr'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { PROVIDER_COLORS, FALLBACK_COLORS } from '@/components/provider-trend-chart'
import type { ProviderSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  tenantId: string
  days: number
}

interface TooltipPayload {
  name: string
  value: number
  payload: ProviderSummary & { pct: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
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
      <p className="font-semibold text-cyan-300">{d.name}</p>
      <p className="text-foreground">${Number(d.value).toFixed(2)}</p>
      <p className="text-muted-foreground">{d.payload.pct.toFixed(1)}% of total</p>
    </div>
  )
}

export function ProviderDonutChart({ tenantId, days }: Props) {
  const { data: res } = useSWR<{ data: ProviderSummary[] }>(
    tenantId ? `/api/summary/providers?tenantId=${tenantId}&days=${days}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const rows = res?.data ?? []
  const total = rows.reduce((s, r) => s + Number(r.total_cost), 0)
  const chartData = rows.map((r, i) => ({
    ...r,
    name: r.service_provider,
    value: Number(r.total_cost),
    pct: total > 0 ? (Number(r.total_cost) / total) * 100 : 0,
    fill: PROVIDER_COLORS[r.service_provider] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
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
        <div className="mb-2">
          <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Spend by Provider
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last {days === 1 ? '24h' : `${days} days`}</p>
        </div>

        {!res ? (
          <div className="animate-pulse h-[220px] rounded-lg bg-white/5" />
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={600}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-cyan-300">${total.toFixed(0)}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 mt-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
              <span className="font-semibold text-foreground">{d.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
