'use client'

import { Sidebar } from '@/components/sidebar'
import { MetricCard } from '@/components/metric-card'
import { SpendingChart } from '@/components/spending-chart'
import { ApiLogsTable } from '@/components/api-logs-table'
import { AnimatedBackground } from '@/components/animated-background'
import { DollarSign, Zap, Users, TrendingDown, RefreshCw } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-20">
        {/* Header */}
        <div 
          className="sticky top-0 z-30 backdrop-blur-xl border-b border-cyan-400/10"
          style={{
            background: 'linear-gradient(to bottom, rgba(20, 30, 60, 0.7), rgba(20, 30, 60, 0.3))',
          }}
        >
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Real-time cloud cost optimization insights</p>
            </div>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: '#22d3ee',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 relative z-10">
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
