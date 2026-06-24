'use client'

import { BarChart3, Settings, TrendingUp, AlertTriangle, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

const navLinks: NavLink[] = [
  {
    label: 'Dashboard',
    href: '#',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Anomalies',
    href: '#',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    label: 'Multi-Tenant Billing',
    href: '#',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'AI Recommendations',
    href: '#',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '#',
    icon: <Settings className="w-5 h-5" />,
  },
]

export function Sidebar() {
  const [activeLink, setActiveLink] = useState('Dashboard')

  return (
    <aside className="w-64 bg-sidebar/40 backdrop-blur-xl border-r border-sidebar-border/50 h-screen flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="px-6 py-8 border-b border-sidebar-border/50 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center"
            style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              FinOps
            </h1>
            <p className="text-xs text-muted-foreground">Cloud Optimizer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 relative z-10">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={() => setActiveLink(link.label)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative group ${
              activeLink === link.label
                ? 'text-cyan-300'
                : 'text-sidebar-foreground hover:text-cyan-300'
            }`}
            style={
              activeLink === link.label
                ? {
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.05)',
                  }
                : {}
            }
          >
            <span className="relative z-10">{link.icon}</span>
            <span className="text-sm font-medium">{link.label}</span>
            {activeLink === link.label && (
              <div className="absolute right-0 w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-l" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border/50 text-xs text-muted-foreground relative z-10">
        <p className="text-center text-cyan-400/60">FinOps v2.1.0</p>
      </div>
    </aside>
  )
}
