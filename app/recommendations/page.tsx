'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageShell } from '@/components/page-shell'
import { Lightbulb, Zap, Trash2, Image, DollarSign, AlertTriangle } from 'lucide-react'
import type { Tenant, ProviderSummary, FeatureUsageSummary, EndpointCostSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Rec {
  id: string
  severity: 'high' | 'medium' | 'low'
  icon: React.ReactNode
  title: string
  description: string
  savings?: string
}

const SEV_STYLE = {
  high:   { border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.07)', color: '#f59e0b', label: 'High Impact' },
  medium: { border: 'rgba(34,211,238,0.35)', bg: 'rgba(34,211,238,0.06)', color: '#22d3ee', label: 'Medium' },
  low:    { border: 'rgba(168,85,247,0.35)', bg: 'rgba(168,85,247,0.06)', color: '#a855f7', label: 'Low' },
}

function buildRecs(
  providers: ProviderSummary[],
  features: FeatureUsageSummary[],
  endpoints: EndpointCostSummary[],
): Rec[] {
  const recs: Rec[] = []
  const openai    = providers.find(p => p.service_provider === 'OpenAI')
  const anthropic = providers.find(p => p.service_provider === 'Anthropic')

  if (openai && (!anthropic || Number(openai.total_cost) > Number(anthropic?.total_cost ?? 0) * 1.5)) {
    const savings = (Number(openai.total_cost) * 0.25).toFixed(2)
    recs.push({
      id: 'switch-haiku',
      severity: 'high',
      icon: <Zap className="w-5 h-5" />,
      title: 'Route short queries to Claude Haiku',
      description: `OpenAI spend ($${Number(openai.total_cost).toFixed(2)}) is significantly higher than Anthropic. Queries under 500 tokens cost ~80% less on claude-haiku-4-5. Consider routing classification, summarisation, and simple Q&A to Haiku.`,
      savings,
    })
  }

  const imageFeature = features.find(f => f.feature_name === 'Image Generation')
  if (imageFeature && Number(imageFeature.total_requests) < 100) {
    recs.push({
      id: 'image-batch',
      severity: 'medium',
      icon: <Image className="w-5 h-5" />,
      title: 'Batch image generation requests',
      description: `Image Generation has only ${imageFeature.total_requests} requests but costs $${Number(imageFeature.total_cost).toFixed(2)}. DALL-E 3 charges per image — batch multiple requests in one call to reduce per-unit cost and latency overhead.`,
    })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const stale = endpoints.filter(e => e.updated_at && new Date(e.updated_at) < sevenDaysAgo)
  if (stale.length > 0) {
    recs.push({
      id: 'stale-endpoints',
      severity: 'medium',
      icon: <Trash2 className="w-5 h-5" />,
      title: `${stale.length} endpoint${stale.length > 1 ? 's' : ''} inactive for 7+ days`,
      description: `${stale.map(e => e.api_endpoint).join(', ')} — no calls recorded in the last 7 days. Review whether these integrations are still needed. Removing unused endpoints reduces attack surface and billing confusion.`,
    })
  }

  const topFeature = features[0]
  if (topFeature && features.length > 1) {
    const pct = (Number(topFeature.total_cost) / features.reduce((s, f) => s + Number(f.total_cost), 0) * 100).toFixed(0)
    if (Number(pct) > 60) {
      recs.push({
        id: 'cost-concentration',
        severity: 'low',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: `${topFeature.feature_name} accounts for ${pct}% of feature spend`,
        description: `High cost concentration in a single feature is a risk. Set a per-feature spending alert threshold and review whether this feature can be rate-limited or cached to reduce repeated identical queries.`,
      })
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: 'all-good',
      severity: 'low',
      icon: <DollarSign className="w-5 h-5" />,
      title: 'Spend is well-distributed',
      description: 'No immediate optimisation opportunities detected. Continue monitoring for cost concentration and unexpected provider spikes.',
    })
  }

  return recs
}

function RecCard({ rec }: { rec: Rec }) {
  const s = SEV_STYLE[rec.severity]
  return (
    <div
      className="rounded-xl p-5 flex gap-4 items-start"
      style={{ background: `linear-gradient(135deg, rgba(20,30,60,0.55) 0%, ${s.bg} 100%)`, border: `1px solid ${s.border}` }}
    >
      <div className="mt-0.5 shrink-0" style={{ color: s.color }}>{rec.icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground">{rec.title}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
          >
            {s.label}
          </span>
          {rec.savings && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-green-500/10 text-green-400 border border-green-500/30">
              ~${rec.savings} savings
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{rec.description}</p>
      </div>
    </div>
  )
}

export default function RecommendationsPage() {
  const { data: tenantsRes } = useSWR<{ data: Tenant[] }>('/api/tenants', fetcher)
  const tenants = tenantsRes?.data ?? []
  const [tenantId, setTenantId] = useState('')
  const activeTenant = tenantId || tenants[0]?.tenant_id || ''

  const { data: providersRes } = useSWR<{ data: ProviderSummary[] }>(
    activeTenant ? `/api/summary/providers?tenantId=${activeTenant}` : null, fetcher)
  const { data: featuresRes } = useSWR<{ data: FeatureUsageSummary[] }>(
    activeTenant ? `/api/summary/features?tenantId=${activeTenant}` : null, fetcher)
  const { data: endpointsRes } = useSWR<{ data: EndpointCostSummary[] }>(
    activeTenant ? `/api/summary/endpoints?tenantId=${activeTenant}` : null, fetcher)

  const loaded = providersRes && featuresRes && endpointsRes
  const recs = loaded
    ? buildRecs(providersRes.data ?? [], featuresRes.data ?? [], endpointsRes.data ?? [])
    : []

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
      title="AI Recommendations"
      subtitle="Rule-based cost optimisation suggestions from your usage data"
      headerRight={tenantSelect}
    >
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <p className="text-xs text-muted-foreground">Suggestions are generated from real-time provider and feature data — no manual configuration required.</p>
      </div>
      {!loaded ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-28 rounded-xl bg-white/5" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map(r => <RecCard key={r.id} rec={r} />)}
        </div>
      )}
    </PageShell>
  )
}
