"use client"

import { useState } from "react"
import useSWR from "swr"
import { MetricCard } from "@/components/metric-card"
import { DollarSign, Zap, Hash, Layers, Plus, Rocket, Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TenantSummary {
  total_cost: string
  total_requests: string
  total_tokens: string
  version: number
}

interface Txn {
  transaction_id: string
  workspace_id?: string
  feature_name: string
  service_provider: string
  api_endpoint: string | null
  cost: string
  created_at: string
}

interface BurstStats {
  requested: number
  succeeded: number
  failed: number
  totalRetries: number
  conflictsExhausted: number
  durationMs: number
}

interface Props {
  tenantId: string
}

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const compact = (n: number) => Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)

export function LiveDashboard({ tenantId }: Props) {
  const [busy, setBusy] = useState<null | "single" | "burst">(null)
  const [burst, setBurst] = useState<BurstStats | null>(null)
  const [lastWorkspace, setLastWorkspace] = useState<string>("")

  const { data: summaryRes, mutate: mutateSummary } = useSWR<{ data: TenantSummary | null }>(
    tenantId ? `/api/summary/tenant?tenantId=${tenantId}` : null,
    fetcher,
    { refreshInterval: 1500 },
  )
  const { data: txnsRes, mutate: mutateTxns } = useSWR<{ data: Txn[] }>(
    tenantId ? `/api/transactions?tenantId=${tenantId}&limit=12` : null,
    fetcher,
    { refreshInterval: 1500 },
  )

  const summary = summaryRes?.data ?? null
  const txns = txnsRes?.data ?? []
  const workspaceId = lastWorkspace || txns[0]?.workspace_id || ""

  function buildPayload() {
    return {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      feature_name: "Chat Assistant",
      service_provider: "OpenAI",
      service_name: "gpt-chat",
      api_endpoint: "/v1/chat/completions",
      usage_type: "tokens",
      usage_quantity: 1000,
      model_name: "gpt-4o",
      token_count: 1000,
      cost: Number((Math.random() * 0.01 + 0.001).toFixed(6)),
    }
  }

  async function ensureWorkspace() {
    if (workspaceId) return workspaceId
    const res = await fetch(`/api/transactions?tenantId=${tenantId}&limit=1`).then((r) => r.json())
    const ws = res?.data?.[0]?.workspace_id ?? ""
    setLastWorkspace(ws)
    return ws
  }

  async function simulateOne() {
    setBusy("single")
    try {
      const ws = await ensureWorkspace()
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), workspace_id: ws }),
      })
      await Promise.all([mutateSummary(), mutateTxns()])
    } finally {
      setBusy(null)
    }
  }

  async function fireBurst() {
    setBusy("burst")
    setBurst(null)
    try {
      const ws = await ensureWorkspace()
      const entries = Array.from({ length: 50 }, () => ({ ...buildPayload(), workspace_id: ws }))
      const res = await fetch("/api/ingest/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries }),
      }).then((r) => r.json())
      setBurst(res.data as BurstStats)
      await Promise.all([mutateSummary(), mutateTxns()])
    } finally {
      setBusy(null)
    }
  }

  const totalCost = summary ? Number(summary.total_cost) : 0
  const totalRequests = summary ? Number(summary.total_requests) : 0
  const totalTokens = summary ? Number(summary.total_tokens) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Live metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Cost" value={money(totalCost)} unit="all-time" icon={<DollarSign className="w-5 h-5" />} />
        <MetricCard title="Total Requests" value={compact(totalRequests)} unit="ingested" icon={<Zap className="w-5 h-5" />} />
        <MetricCard title="Total Tokens" value={compact(totalTokens)} unit="processed" icon={<Hash className="w-5 h-5" />} />
        <MetricCard title="Summary Version" value={`v${summary?.version ?? 0}`} unit="OCC updates" icon={<Layers className="w-5 h-5" />} />
      </div>

      {/* Live transactions feed */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(20,30,60,0.4) 0%, rgba(40,20,80,0.15) 100%)",
          border: "1px solid rgba(136,100,255,0.15)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
            Live Ledger Feed
          </h3>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> auto-refreshing
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyan-400/10 text-left">
                <th className="py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">Feature</th>
                <th className="py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">Provider</th>
                <th className="py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">Endpoint</th>
                <th className="py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">Cost</th>
                <th className="py-3 px-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.transaction_id} className="border-b border-cyan-400/5 hover:bg-cyan-400/5">
                  <td className="py-3 px-4 text-foreground">{t.feature_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.service_provider}</td>
                  <td className="py-3 px-4">
                    <code className="px-2 py-1 rounded text-xs" style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc" }}>
                      {t.api_endpoint ?? "-"}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-green-400 font-semibold">${Number(t.cost).toFixed(4)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {txns.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground text-sm">
                    No transactions yet for this tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concurrency Demo */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(20,30,60,0.5) 0%, rgba(40,20,80,0.2) 100%)",
          border: "1px solid rgba(136,100,255,0.2)",
        }}
      >
        <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
          Aurora DSQL Concurrency Demo
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Fire concurrent writes to the same summary rows and observe Aurora DSQL's Optimistic Concurrency Control resolve conflicts live.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            onClick={simulateOne}
            disabled={!tenantId || busy !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.35)", color: "#22d3ee" }}
          >
            {busy === "single" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Simulate Cost Event
          </button>
          <button
            onClick={fireBurst}
            disabled={!tenantId || busy !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc" }}
          >
            {busy === "burst" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Fire 50 Concurrent Writes
          </button>
        </div>
        {burst && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            <Stat label="Requested" value={burst.requested} />
            <Stat label="Succeeded" value={burst.succeeded} accent="#22c55e" />
            <Stat label="Retries (OCC)" value={burst.totalRetries} accent="#22d3ee" />
            <Stat label="Unresolved" value={burst.conflictsExhausted} accent="#ef4444" />
            <Stat label="Duration" value={`${burst.durationMs}ms`} />
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-lg px-3 py-3 bg-[rgba(20,30,60,0.5)] border border-cyan-400/10">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color: accent ?? "#e5e7eb" }}>
        {value}
      </p>
    </div>
  )
}
