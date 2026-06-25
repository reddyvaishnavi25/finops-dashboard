'use client'

import { Sidebar } from '@/components/sidebar'
import { SpendingChart } from '@/components/spending-chart'
import { AnimatedBackground } from '@/components/animated-background'
import { LiveDashboard } from '@/components/live-dashboard'

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
          </div>
        </div>

        {/* Content */}
        <div className="p-8 relative z-10">
          {/* Live metrics + concurrency demo + ledger feed */}
          <section className="mb-8">
            <LiveDashboard />
          </section>

          {/* Charts Section */}
          <section>
            <SpendingChart />
          </section>
        </div>
      </main>
    </div>
  )
}
