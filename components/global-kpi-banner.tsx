'use client'

import useSWR from 'swr'
import { DollarSign, CalendarDays, Activity, Users } from 'lucide-react'
import { MetricCard } from '@/components/metric-card'
import type { GlobalSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export function GlobalKPIBanner() {
  const { data: res } = useSWR<{ data: GlobalSummary }>(
    '/api/summary/global',
    fetcher,
    { refreshInterval: 10000 },
  )
  const g = res?.data

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(34,211,238,0.4), transparent)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#22d3ee' }}>
          Platform Overview — All Tenants
        </span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(34,211,238,0.4), transparent)' }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Platform Spend"
          value={money(Number(g?.total_spend ?? 0))}
          unit="all tenants · all time"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Today's Spend"
          value={money(Number(g?.today_spend ?? 0))}
          unit="since midnight UTC"
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <MetricCard
          title="Total API Requests"
          value={compact(Number(g?.total_requests ?? 0))}
          unit="platform-wide"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="Active Tenants"
          value={String(g?.active_tenants ?? '—')}
          unit="clients on platform"
          icon={<Users className="w-5 h-5" />}
        />
      </div>
    </div>
  )
}
