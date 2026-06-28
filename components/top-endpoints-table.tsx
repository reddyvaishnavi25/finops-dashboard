'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { EndpointCostSummary } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type SortBy = 'cost' | 'requests'

interface Props {
  tenantId: string
}

export function TopEndpointsTable({ tenantId }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('cost')

  const { data: res } = useSWR<{ data: EndpointCostSummary[] }>(
    tenantId ? `/api/summary/endpoints?tenantId=${tenantId}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

  const allRows = res?.data ?? []
  const sorted = [...allRows].sort((a, b) =>
    sortBy === 'cost'
      ? Number(b.total_cost) - Number(a.total_cost)
      : Number(b.request_count) - Number(a.request_count),
  ).slice(0, 5)

  const compact = (n: number) =>
    Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
              Top 5 API Endpoints
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Highest-impact endpoints for this tenant</p>
          </div>
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(20,30,60,0.6)', border: '1px solid rgba(136,100,255,0.2)' }}
          >
            {(['cost', 'requests'] as SortBy[]).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200"
                style={
                  s === sortBy
                    ? {
                        background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(168,85,247,0.2) 100%)',
                        color: '#22d3ee',
                        border: '1px solid rgba(34,211,238,0.4)',
                      }
                    : { color: 'oklch(0.65 0 0)' }
                }
              >
                By {s === 'cost' ? 'Cost' : 'Usage'}
              </button>
            ))}
          </div>
        </div>

        {!res ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-10 rounded-lg bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyan-400/10 text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-cyan-300 uppercase tracking-wider">Endpoint</th>
                  <th className="pb-2 px-3 text-xs font-semibold text-cyan-300 uppercase tracking-wider text-right">Cost</th>
                  <th className="pb-2 px-3 text-xs font-semibold text-cyan-300 uppercase tracking-wider text-right">Requests</th>
                  <th className="pb-2 pl-3 text-xs font-semibold text-cyan-300 uppercase tracking-wider text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.api_endpoint + i} className="border-b border-cyan-400/5 hover:bg-cyan-400/5">
                    <td className="py-2.5 pr-4">
                      <code
                        className="px-2 py-0.5 rounded text-xs truncate block max-w-[180px]"
                        style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}
                        title={row.api_endpoint}
                      >
                        {row.api_endpoint}
                      </code>
                    </td>
                    <td className="py-2.5 px-3 text-green-400 font-semibold text-right text-xs">
                      ${Number(row.total_cost).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-right text-xs">
                      {compact(Number(row.request_count))}
                    </td>
                    <td className="py-2.5 pl-3 text-muted-foreground text-right text-xs">
                      {compact(Number(row.total_tokens))}
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">
                      No endpoint data for this tenant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
