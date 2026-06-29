'use client'

import useSWR from 'swr'
import { PageShell } from '@/components/page-shell'
import type { TenantBudgetRow } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TIER_DEFAULTS: Record<string, number> = {
  enterprise: 10000,
  growth: 5000,
  starter: 2000,
}

const TIER_STYLES: Record<string, { border: string; color: string; bg: string }> = {
  enterprise: { border: 'rgba(34,211,238,0.5)', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  growth:     { border: 'rgba(245,158,11,0.5)', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  starter:    { border: 'rgba(107,114,128,0.5)', color: '#9ca3af', bg: 'rgba(107,114,128,0.1)' },
}

const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

function BudgetBar({ cost, budget }: { cost: number; budget: number }) {
  const pct = Math.min(100, (cost / budget) * 100)
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : undefined
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>${cost.toFixed(0)}</span>
        <span>${budget.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: color ?? 'linear-gradient(to right, #a855f7, #22d3ee)',
          }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{pct.toFixed(1)}% used</p>
    </div>
  )
}

export default function BillingPage() {
  const { data: res } = useSWR<{ data: TenantBudgetRow[] }>('/api/settings/budgets', fetcher, { refreshInterval: 10000 })
  const tenants = res?.data ?? []

  return (
    <PageShell title="Multi-Tenant Billing" subtitle="Cost and usage across all corporate tenants">
      {!res ? (
        <div className="animate-pulse h-64 rounded-xl bg-white/5" />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(20,30,60,0.4) 0%, rgba(40,20,80,0.15) 100%)',
            border: '1px solid rgba(136,100,255,0.15)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyan-400/10">
                {['Company', 'Tier', 'Total Spend', 'Requests', 'Tokens', 'Budget Usage', 'Last Activity'].map(h => (
                  <th key={h} className="py-4 px-5 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const cost = Number(t.total_cost ?? 0)
                const budget = t.monthly_budget ? Number(t.monthly_budget) : (TIER_DEFAULTS[t.subscription_tier] ?? 2000)
                const tierStyle = TIER_STYLES[t.subscription_tier] ?? TIER_STYLES.starter
                const lastActive = t.last_activity
                  ? new Date(t.last_activity).toLocaleString()
                  : '—'
                return (
                  <tr key={t.tenant_id} className="border-b border-cyan-400/5 hover:bg-cyan-400/5 transition-colors">
                    <td className="py-4 px-5 font-semibold text-foreground">{t.company_name}</td>
                    <td className="py-4 px-5">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={{ color: tierStyle.color, background: tierStyle.bg, border: `1px solid ${tierStyle.border}` }}
                      >
                        {t.subscription_tier}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-green-400 font-bold">${cost.toFixed(2)}</td>
                    <td className="py-4 px-5 text-muted-foreground">{compact(Number(t.total_requests ?? 0))}</td>
                    <td className="py-4 px-5 text-muted-foreground">{compact(Number(t.total_tokens ?? 0))}</td>
                    <td className="py-4 px-5 w-44">
                      <BudgetBar cost={cost} budget={budget} />
                    </td>
                    <td className="py-4 px-5 text-xs text-muted-foreground">{lastActive}</td>
                  </tr>
                )
              })}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">No tenant data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
