'use client'

import { Sidebar } from '@/components/sidebar'
import { AnimatedBackground } from '@/components/animated-background'

interface PageShellProps {
  title: string
  subtitle?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}

export function PageShell({ title, subtitle, headerRight, children }: PageShellProps) {
  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <Sidebar />
      <main className="flex-1 overflow-auto relative z-20">
        <div
          className="sticky top-0 z-30 backdrop-blur-xl border-b border-cyan-400/10"
          style={{
            background: 'linear-gradient(to bottom, rgba(20, 30, 60, 0.7), rgba(20, 30, 60, 0.3))',
          }}
        >
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </div>
        <div className="p-8 relative z-10">{children}</div>
      </main>
    </div>
  )
}
