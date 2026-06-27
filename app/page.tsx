'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Sidebar } from '@/components/sidebar'
import { AnimatedBackground } from '@/components/animated-background'
import { MetricCard } from '@/components/metric-card'
import { SpendingChart } from '@/components/spending-chart'
import { LiveDashboard } from '@/components/live-dashboard'
import { ProviderTrendChart } from '@/components/provider-trend-chart'
import { ProviderDonutChart } from '@/components/provider-donut-chart'
import { FeatureBarChart } from '@/components/feature-bar-chart'
import { UsageTypeDonutChart } from '@/components/usage-type-donut-chart'
import {
  DollarSign, TrendingUp, Cpu, Users, Activity, CalendarDays,
} from 'lucide-react'
import type { Tenant, TenantUsageSummary, ProviderSummary, DailySummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())
type Days = 7 | 30 | 90

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

function TimeToggle({ value, onChange }: { value: Days; onChange: (d: Days) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(20,30,60,0.6)', border: '1px solid rgba(136,100,255,0.2)' }}>
      {([7, 30, 90] as Days[]).map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
          style={
            d === value
              ? { background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(168,85,247,0.2) 100%)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.4)' }
              : { color: 'oklch(0.65 0 0)' }
          }
        >
          {d}D
        </button>
      ))}
    </div>
  )
}

export default function Page() {
  const { data: tenantsRes } = useSWR<{ data: Tenant[] }>('/api/tenants', fetcher)
  const tenants = tenantsRes?.data ?? []
  const [tenantId, setTenantId] = useState('')
  const activeTenant = tenantId || tenants[0]?.tenant_id || ''
  const [days, setDays] = useState<Days>(30)

  // Data for top metric cards
  const { data: summaryRes } = useSWR<{ data: TenantUsageSummary | null }>(
    activeTenant ? `/api/summary/tenant?tenantId=${activeTenant}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )
  const { data: providersRes } = useSWR<{ data: ProviderSummary[] }>(
    activeTenant ? `/api/summary/providers?tenantId=${activeTenant}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )
  const { data: dailyRes } = useSWR<{ data: DailySummary[] }>(
    activeTenant ? `/api/summary/daily?tenantId=${activeTenant}&days=30` : null,
    fetcher,
    { refreshInterval: 5000 },
  )
  const { data: todayRes } = useSWR<{ data: DailySummary[] }>(
    activeTenant ? `/api/summary/daily?tenantId=${activeTenant}&days=1` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const summary    = summaryRes?.data
  const providers  = providersRes?.data ?? []
  const topProvider = providers[0]?.service_provider ?? '—'
  const monthRequests = (dailyRes?.data ?? []).reduce((s, d) => s + Number(d.total_requests), 0)
  const todayCost  = (todayRes?.data ?? []).reduce((s, d) => s + Number(d.total_cost), 0)

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-20">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 backdrop-blur-xl border-b border-cyan-400/10"
          style={{ background: 'linear-gradient(to bottom, rgba(20,30,60,0.75), rgba(20,30,60,0.35))' }}
        >
          <div className="px-8 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time cloud & AI cost visibility</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Tenant</span>
              <select
                value={activeTenant}
                onChange={e => setTenantId(e.target.value)}
                className="rounded-lg bg-[rgba(20,30,60,0.6)] border border-cyan-400/20 px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-400/50"
              >
                {tenants.map(t => (
                  <option key={t.tenant_id} value={t.tenant_id} className="bg-[#0b1020]">
                    {t.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 relative z-10">

          {/* Row 1 — 6 metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Total Spend"
              value={money(Number(summary?.total_cost ?? 0))}
              unit="all-time"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <MetricCard
              title="Today's Cost"
              value={money(todayCost)}
              unit="last 24h"
              icon={<CalendarDays className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Tokens"
              value={compact(Number(summary?.total_tokens ?? 0))}
              unit="processed"
              icon={<Cpu className="w-5 h-5" />}
            />
            <MetricCard
              title="Active Tenants"
              value={String(tenants.length)}
              unit="clients"
              icon={<Users className="w-5 h-5" />}
            />
            <MetricCard
              title="Top Provider"
              value={topProvider}
              unit="by spend"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricCard
              title="Requests / 30d"
              value={compact(monthRequests)}
              unit="API calls"
              icon={<Activity className="w-5 h-5" />}
            />
          </div>

          {/* Row 2 — time range toggle */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Time Range</p>
            <TimeToggle value={days} onChange={setDays} />
          </div>

          {/* Row 3 — provider trend (60%) + provider donut (40%) */}
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <ProviderTrendChart tenantId={activeTenant} days={days} />
            </div>
            <div className="col-span-2">
              <ProviderDonutChart tenantId={activeTenant} />
            </div>
          </div>

          {/* Row 4 — daily spend chart full width */}
          <SpendingChart tenantId={activeTenant} days={days} />

          {/* Row 5 — feature bar (50%) + usage type donut (50%) */}
          <div className="grid grid-cols-2 gap-6">
            <FeatureBarChart tenantId={activeTenant} />
            <UsageTypeDonutChart tenantId={activeTenant} />
          </div>

          {/* Row 6 — live ledger feed + concurrency demo */}
          <LiveDashboard tenantId={activeTenant} />

        </div>
      </main>
    </div>
  )
}
