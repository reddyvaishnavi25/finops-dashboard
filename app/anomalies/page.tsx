'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageShell } from '@/components/page-shell'
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import type { Tenant, AnomalyRow } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function getSeverity(ratio: number) {
  if (ratio >= 5) return { label: 'Critical', border: 'rgba(239,68,68,0.45)', bg: 'rgba(239,68,68,0.08)', color: '#ef4444' }
  if (ratio >= 3) return { label: 'High',     border: 'rgba(245,158,11,0.45)', bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' }
  return           { label: 'Medium',  border: 'rgba(234,179,8,0.4)',   bg: 'rgba(234,179,8,0.06)',  color: '#eab308' }
}

function AnomalyCard({ a }: { a: AnomalyRow }) {
  const ratio = Number(a.ratio)
  const pctOver = ((ratio - 1) * 100).toFixed(0)
  const sev = getSeverity(ratio)

  return (
    <div
      className="rounded-xl p-5 flex gap-4 items-start"
      style={{ background: `linear-gradient(135deg, rgba(20,30,60,0.55) 0%, ${sev.bg} 100%)`, border: `1px solid ${sev.border}` }}
    >
      <div className="mt-0.5 shrink-0">
        <AlertTriangle className="w-5 h-5" style={{ color: sev.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground">{a.service_provider}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
          >
            {sev.label}
          </span>
          <span className="text-xs text-muted-foreground">{a.day}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Daily cost spiked <span className="font-bold" style={{ color: sev.color }}>{pctOver}% above baseline</span>
        </p>
        <div className="flex gap-6 mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spike Cost</p>
            <p className="text-base font-bold text-foreground">${Number(a.daily_cost).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Cost</p>
            <p className="text-base font-bold text-muted-foreground">${Number(a.avg_cost).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Multiplier</p>
            <p className="text-base font-bold" style={{ color: sev.color }}>{ratio.toFixed(1)}×</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnomaliesPage() {
  const { data: tenantsRes } = useSWR<{ data: Tenant[] }>('/api/tenants', fetcher)
  const tenants = tenantsRes?.data ?? []
  const [tenantId, setTenantId] = useState('')
  const activeTenant = tenantId || tenants[0]?.tenant_id || ''

  const { data: anomalyRes } = useSWR<{ data: AnomalyRow[] }>(
    activeTenant ? `/api/anomalies?tenantId=${activeTenant}&days=30` : null,
    fetcher,
    { refreshInterval: 10000 },
  )
  const anomalies = anomalyRes?.data ?? []

  const tenantSelect = (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Tenant</span>
      <select
        value={activeTenant}
        onChange={e => setTenantId(e.target.value)}
        className="rounded-lg bg-[rgba(20,30,60,0.6)] border border-cyan-400/20 px-3 py-1.5 text-sm text-foreground outline-none focus:border-cyan-400/50"
      >
        {tenants.map(t => (
          <option key={t.tenant_id} value={t.tenant_id} className="bg-[#0b1020]">{t.company_name}</option>
        ))}
      </select>
    </div>
  )

  return (
    <PageShell
      title="Anomalies"
      subtitle="Cost spikes detected vs. historical baseline (last 30 days)"
      headerRight={tenantSelect}
    >
      {!anomalyRes ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-28 rounded-xl bg-white/5" />)}
        </div>
      ) : anomalies.length === 0 ? (
        <div
          className="rounded-xl p-10 flex flex-col items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(20,30,60,0.4) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
          <p className="text-base font-semibold text-green-400">No anomalies detected</p>
          <p className="text-xs text-muted-foreground">All providers are within 2× of their historical daily average.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{anomalies.length}</span> spike{anomalies.length !== 1 ? 's' : ''} found — days where a provider&apos;s cost exceeded 2× its average
            </p>
          </div>
          <div className="space-y-3">
            {anomalies.map((a, i) => <AnomalyCard key={i} a={a} />)}
          </div>
        </>
      )}
    </PageShell>
  )
}
