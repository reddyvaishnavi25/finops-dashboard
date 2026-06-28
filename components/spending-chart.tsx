'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

import type { DailySummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface HourlyRow {
  hour_ts: string
  total_cost: string
  total_requests: string
  total_tokens: string
}

interface Props {
  tenantId: string
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function fmt(v: number, isTokens: boolean) {
  return isTokens
    ? Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 0 }).format(v)
    : `$${Number(v).toFixed(4)}`
}

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg p-3 backdrop-blur-xl border border-cyan-400/30"
      style={{
        background: 'linear-gradient(135deg, rgba(20,30,60,0.9) 0%, rgba(40,20,80,0.7) 100%)',
        boxShadow: '0 0 20px rgba(34,211,238,0.2)',
      }}
    >
      <p className="text-xs text-cyan-300 font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {fmt(Number(entry.value), entry.name === 'Tokens')}
        </p>
      ))}
    </div>
  )
}

function formatHour(isoStr: string) {
  const d = new Date(isoStr)
  const h = d.getHours()
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

export function SpendingChart({ tenantId }: Props) {
  const [view, setView] = useState<'today' | '7d'>('today')
  const [showTokens, setShowTokens] = useState(false)

  const isToday = view === 'today'

  const { data: dailyRes } = useSWR<{ data: DailySummary[] }>(
    !isToday && tenantId ? `/api/summary/daily?tenantId=${tenantId}&days=7` : null,
    fetcher,
    { refreshInterval: 5000 },
  )
  const { data: hourlyRes } = useSWR<{ data: HourlyRow[] }>(
    isToday && tenantId ? `/api/summary/hourly?tenantId=${tenantId}` : null,
    fetcher,
    { refreshInterval: 1500 },
  )

  const chartData = isToday
    ? (hourlyRes?.data ?? []).map(r => ({
        label: formatHour(r.hour_ts),
        spend: Number(r.total_cost),
        requests: Number(r.total_requests),
        tokens: Number(r.total_tokens),
      }))
    : (dailyRes?.data ?? []).map(d => ({
        label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: Number(d.total_cost),
        requests: Number(d.total_requests),
        tokens: Number(d.total_tokens),
      }))

  const loading = isToday ? !hourlyRes : !dailyRes
  const currentHourLabel = formatHour(new Date().toISOString())

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
              {isToday ? "Today's Spend — Hourly" : 'Daily Spending Trend'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isToday
                ? 'Cost per hour · refreshes every 1.5s'
                : 'Total cost per day · last 7 days'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Today / 7D view toggle */}
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: 'rgba(20,30,60,0.6)', border: '1px solid rgba(136,100,255,0.2)' }}
            >
              {(['today', '7d'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200"
                  style={
                    v === view
                      ? {
                          background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2))',
                          color: '#22d3ee',
                          border: '1px solid rgba(34,211,238,0.4)',
                        }
                      : { color: 'oklch(0.65 0 0)' }
                  }
                >
                  {v === 'today' ? 'Today' : '7D'}
                </button>
              ))}
            </div>

            {/* Token Trend toggle */}
            <button
              onClick={() => setShowTokens(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={
                showTokens
                  ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }
                  : { background: 'rgba(20,30,60,0.5)', border: '1px solid rgba(136,100,255,0.2)', color: 'oklch(0.65 0 0)' }
              }
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b', opacity: showTokens ? 1 : 0.4 }} />
              Token Trend
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse h-[300px] rounded-lg bg-white/5" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No data yet for today
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: showTokens ? 60 : 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="oklch(0.65 0 0)"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'oklch(0.65 0 0)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="cost"
                stroke="oklch(0.65 0 0)"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'oklch(0.65 0 0)' }}
                tickFormatter={v => {
                  const n = Number(v)
                  if (n === 0) return '$0'
                  if (n < 0.01) return `$${n.toFixed(4)}`
                  if (n < 1) return `$${n.toFixed(2)}`
                  return `$${n.toFixed(0)}`
                }}
              />
              {showTokens && (
                <YAxis
                  yAxisId="tokens"
                  orientation="right"
                  stroke="#f59e0b"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#f59e0b' }}
                  tickFormatter={v =>
                    Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 0 }).format(Number(v))
                  }
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              {/* Current hour reference line when viewing today */}
              {isToday && (
                <ReferenceLine
                  yAxisId="cost"
                  x={currentHourLabel}
                  stroke="rgba(34,211,238,0.4)"
                  strokeDasharray="4 4"
                  label={{ value: 'now', fill: '#22d3ee', fontSize: 10, position: 'top' }}
                />
              )}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="spend"
                stroke="#e91e63"
                strokeWidth={3}
                dot={isToday ? { fill: '#e91e63', r: 3 } : false}
                isAnimationActive={!isToday}
                name="Spend"
                animationDuration={800}
              />
              {showTokens && (
                <Line
                  yAxisId="tokens"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={false}
                  isAnimationActive={false}
                  name="Tokens"
                  animationDuration={800}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="flex gap-6 mt-6 pt-4 border-t border-cyan-400/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500/80" />
            <span className="text-xs text-muted-foreground">{isToday ? 'Hourly Spend' : 'Daily Cost'}</span>
          </div>
          {isToday && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0 border-t-2 border-dashed border-cyan-400/50" />
              <span className="text-xs text-muted-foreground">Current hour</span>
            </div>
          )}
          {showTokens && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ background: '#f59e0b', borderTop: '2px dashed #f59e0b' }} />
              <span className="text-xs text-muted-foreground">Token Usage</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
