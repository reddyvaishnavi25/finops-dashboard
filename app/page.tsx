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
import { GlobalKPIBanner } from '@/components/global-kpi-banner'
import { TenantComparisonChart } from '@/components/tenant-comparison-chart'
import { TopEndpointsTable } from '@/components/top-endpoints-table'
import { ModelBreakdownSection } from '@/components/model-breakdown-section'
import { WorkspaceBreakdownChart } from '@/components/workspace-breakdown-chart'
import { DollarSign, TrendingUp, Cpu, Activity } from 'lucide-react'
import type { Tenant, TenantUsageSummary, ProviderSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())
type Days = 1 | 7 | 30 | 90

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

function TimeToggle({ value, onChange }: { value: Days; onChange: (d: Days) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(20,30,60,0.6)', border: '1px solid rgba(136,100,255,0.2)' }}>
      {([1, 7, 30, 90] as Days[]).map(d => (
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
          {d === 1 ? 'Today' : `${d}D`}
        </button>
      ))}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(168,85,247,0.5), transparent)' }} />
      <span className="text-xs font-bold uppercase tracking-widest px-2" style={{ color: '#a855f7' }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(168,85,247,0.5), transparent)' }} />
    </div>
  )
}

export default function Page() {
  const { data: tenantsRes } = useSWR<{ data: Tenant[] }>('/api/tenants', fetcher)
  const tenants = tenantsRes?.data ?? []
  const [tenantId, setTenantId] = useState('')
  const activeTenant = tenantId || tenants[0]?.tenant_id || ''
  const [days, setDays] = useState<Days>(30)

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

  const summary = summaryRes?.data
  const providers = providersRes?.data ?? []
  const topProvider = providers[0]?.service_provider ?? '—'

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
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
              SpendSense Enterprise
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time AI & cloud cost intelligence</p>
          </div>
        </div>

        <div className="p-8 space-y-6 relative z-10">

          {/* ── SECTION 1: Global Platform KPIs ── */}
          <GlobalKPIBanner />

          {/* ── SECTION 2: Platform Comparison Chart ── */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform trend</p>
            <TimeToggle value={days} onChange={setDays} />
          </div>
          <TenantComparisonChart days={days} />

          {/* ── SECTION 3: Tenant Deep-Dive ── */}
          <SectionDivider label="Tenant Deep-Dive" />

          {/* Tenant selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Viewing tenant</span>
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

          {/* Per-tenant KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Tenant Total Spend"
              value={money(Number(summary?.total_cost ?? 0))}
              unit="all-time"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Requests"
              value={compact(Number(summary?.total_requests ?? 0))}
              unit="API calls"
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Tokens"
              value={compact(Number(summary?.total_tokens ?? 0))}
              unit="processed"
              icon={<Cpu className="w-5 h-5" />}
            />
            <MetricCard
              title="Top Provider"
              value={topProvider}
              unit="by spend"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>

          {/* Top Endpoints (60%) + Model Breakdown (40%) */}
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <TopEndpointsTable tenantId={activeTenant} />
            </div>
            <div className="col-span-2">
              <ModelBreakdownSection tenantId={activeTenant} />
            </div>
          </div>

          {/* Daily Spending + Tokens toggle */}
          <SpendingChart tenantId={activeTenant} />

          {/* Provider Trend (60%) + Provider Donut (40%) */}
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <ProviderTrendChart tenantId={activeTenant} days={days} />
            </div>
            <div className="col-span-2">
              <ProviderDonutChart tenantId={activeTenant} days={days} />
            </div>
          </div>

          {/* Feature Bar (50%) + Workspace Breakdown (50%) */}
          <div className="grid grid-cols-2 gap-6">
            <FeatureBarChart tenantId={activeTenant} days={days} />
            <WorkspaceBreakdownChart tenantId={activeTenant} days={days} />
          </div>

          {/* Usage Type Donut */}
          <div className="grid grid-cols-2 gap-6">
            <UsageTypeDonutChart tenantId={activeTenant} days={days} />
            <div />
          </div>

          {/* Live Ledger Feed + Concurrency Demo */}
          <SectionDivider label="Live Activity" />
          <LiveDashboard tenantId={activeTenant} />

        </div>
      </main>
    </div>
  )
}
