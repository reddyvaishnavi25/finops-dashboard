'use client'

import { Sidebar } from '@/components/sidebar'
import { MetricCard } from '@/components/metric-card'
import { SpendingChart } from '@/components/spending-chart'
import { ApiLogsTable } from '@/components/api-logs-table'
import { DollarSign, Zap, Users, TrendingDown, RefreshCw } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time cloud cost optimization insights</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors border border-primary/20">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Metrics Grid */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Cloud Spend"
                value="$64,521"
                unit="this month"
                trend={{ value: 8, isPositive: true }}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <MetricCard
                title="AI API Ingestion Rate"
                value="2.4M"
                unit="requests/day"
                trend={{ value: 12, isPositive: true }}
                icon={<Zap className="w-5 h-5" />}
              />
              <MetricCard
                title="Active Tenants"
                value="847"
                unit="organizations"
                trend={{ value: 3, isPositive: true }}
                icon={<Users className="w-5 h-5" />}
              />
              <MetricCard
                title="Automated Savings"
                value="$18,947"
                unit="this month"
                trend={{ value: 15, isPositive: false }}
                icon={<TrendingDown className="w-5 h-5" />}
              />
            </div>
          </section>

          {/* Charts Section */}
          <section className="mb-8">
            <SpendingChart />
          </section>

          {/* API Logs Section */}
          <section>
            <ApiLogsTable />
          </section>
        </div>
      </main>
    </div>
  )
}
