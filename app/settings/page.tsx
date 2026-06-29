'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { PageShell } from '@/components/page-shell'
import { DollarSign, Bell, Check, Save } from 'lucide-react'
import type { TenantBudgetRow } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TIER_DEFAULTS: Record<string, number> = { enterprise: 10000, growth: 5000, starter: 2000 }
const TIER_STYLES: Record<string, { border: string; color: string; bg: string }> = {
  enterprise: { border: 'rgba(34,211,238,0.5)',   color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  growth:     { border: 'rgba(245,158,11,0.5)',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  starter:    { border: 'rgba(107,114,128,0.5)', color: '#9ca3af', bg: 'rgba(107,114,128,0.1)' },
}

// ── shared card wrapper ──────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(20,30,60,0.5) 0%, rgba(40,20,80,0.2) 100%)',
        border: '1px solid rgba(136,100,255,0.15)',
      }}
    >
      {children}
    </div>
  )
}

// ── section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Icon className="w-5 h-5 text-cyan-400" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(to right, rgba(34,211,238,0.3), transparent)' }}
      />
    </div>
  )
}

// ── toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 focus:outline-none"
      style={{
        background: enabled
          ? 'linear-gradient(to right, #22d3ee, #a855f7)'
          : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(136,100,255,0.2)',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

// ── Section 1: Budget Thresholds ──────────────────────────────────────────────
function BudgetSection() {
  const { data: res, mutate } = useSWR<{ data: TenantBudgetRow[] }>('/api/settings/budgets', fetcher)
  const tenants = res?.data ?? []

  const [values, setValues] = useState<Record<string, { budget: string; threshold: string }>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!res?.data || !Array.isArray(res.data)) return
    const init: Record<string, { budget: string; threshold: string }> = {}
    for (const t of res.data) {
      const defaultBudget = TIER_DEFAULTS[t.subscription_tier] ?? 2000
      init[t.tenant_id] = {
        budget: t.monthly_budget ? Number(t.monthly_budget).toFixed(0) : String(defaultBudget),
        threshold: t.alert_threshold ? (Number(t.alert_threshold) * 100).toFixed(0) : '80',
      }
    }
    setValues(init)
  }, [res])

  async function handleSave(tenantId: string) {
    const v = values[tenantId]
    if (!v) return
    setSaving(s => ({ ...s, [tenantId]: true }))
    try {
      await fetch('/api/settings/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          monthly_budget: parseFloat(v.budget) || 2000,
          alert_threshold: (parseFloat(v.threshold) || 80) / 100,
        }),
      })
      await mutate()
      setSaved(s => ({ ...s, [tenantId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [tenantId]: false })), 2000)
    } finally {
      setSaving(s => ({ ...s, [tenantId]: false }))
    }
  }

  return (
    <Card>
      <SectionHeader icon={DollarSign} title="Budget Thresholds" />
      <div
        className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg text-xs"
        style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}
      >
        <span className="shrink-0">ℹ</span>
        Changes reflect immediately on the Billing page. Leave blank to use subscription-tier defaults.
      </div>

      {!res ? (
        <div className="animate-pulse h-40 rounded-lg bg-white/5" />
      ) : (
        <div className="space-y-3">
          {tenants.map(t => {
            const v = values[t.tenant_id] ?? { budget: '', threshold: '80' }
            const tierStyle = TIER_STYLES[t.subscription_tier] ?? TIER_STYLES.starter
            const spend = Number(t.total_cost ?? 0)
            const tierBudget = TIER_DEFAULTS[t.subscription_tier] ?? 2000
            const budget = parseFloat(v.budget) || tierBudget
            const pct = Math.min(100, (spend / budget) * 100)
            const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : undefined

            return (
              <div
                key={t.tenant_id}
                className="rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(136,100,255,0.1)' }}
              >
                {/* Company + tier */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.company_name}</p>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ color: tierStyle.color, background: tierStyle.bg, border: `1px solid ${tierStyle.border}` }}
                    >
                      {t.subscription_tier}
                    </span>
                  </div>
                </div>

                {/* Budget bar */}
                <div className="w-full sm:w-36">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>${spend.toFixed(0)} spent</span>
                    <span>${budget.toLocaleString()} cap</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColor ?? 'linear-gradient(to right, #a855f7, #22d3ee)' }}
                    />
                  </div>
                </div>

                {/* Budget input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Budget $</span>
                  <input
                    type="number"
                    value={v.budget}
                    onChange={e => setValues(prev => ({ ...prev, [t.tenant_id]: { ...v, budget: e.target.value } }))}
                    className="w-24 rounded-lg bg-[rgba(20,30,60,0.6)] border border-cyan-400/20 px-2 py-1.5 text-sm text-foreground outline-none focus:border-cyan-400/50 text-right"
                  />
                </div>

                {/* Alert % input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Alert at</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={v.threshold}
                    onChange={e => setValues(prev => ({ ...prev, [t.tenant_id]: { ...v, threshold: e.target.value } }))}
                    className="w-16 rounded-lg bg-[rgba(20,30,60,0.6)] border border-cyan-400/20 px-2 py-1.5 text-sm text-foreground outline-none focus:border-cyan-400/50 text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>

                {/* Save button */}
                <button
                  onClick={() => handleSave(t.tenant_id)}
                  disabled={saving[t.tenant_id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0"
                  style={
                    saved[t.tenant_id]
                      ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }
                      : { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', color: '#a855f7' }
                  }
                >
                  {saved[t.tenant_id]
                    ? <><Check className="w-3.5 h-3.5" /> Saved</>
                    : <><Save className="w-3.5 h-3.5" /> Save</>}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ── Section 2: Notification Preferences ──────────────────────────────────────
const NOTIF_KEY = 'spendsense_notif_prefs'

const NOTIFS = [
  { key: 'anomalyAlerts',  label: 'Anomaly Alerts',   desc: 'Get notified when a provider\'s spend spikes >2× its baseline' },
  { key: 'weeklyDigest',   label: 'Weekly Digest',     desc: 'Summary email every Monday at 9 AM with top cost movers' },
  { key: 'budgetWarnings', label: 'Budget Warnings',   desc: 'Alert when a tenant\'s monthly spend crosses the alert threshold' },
] as const

type NotifKey = typeof NOTIFS[number]['key']

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>({
    anomalyAlerts:  true,
    weeklyDigest:   false,
    budgetWarnings: true,
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY)
      if (stored) setPrefs(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  function toggle(key: NotifKey) {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <Card>
      <SectionHeader icon={Bell} title="Notification Preferences" />
      <div className="space-y-4">
        {NOTIFS.map(n => (
          <div key={n.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{n.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
            </div>
            <Toggle enabled={prefs[n.key]} onChange={() => toggle(n.key)} />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-5 pt-4 border-t border-white/5 italic">
        Notification delivery requires backend configuration. Preferences are saved locally for this demo.
      </p>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="Tenant budget controls & notification preferences">
      <div className="space-y-8">
        <BudgetSection />
        <NotificationsSection />
      </div>
    </PageShell>
  )
}
