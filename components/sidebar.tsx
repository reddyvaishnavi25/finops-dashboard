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
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">FinOps</h1>
            <p className="text-xs text-muted-foreground">Cloud Optimizer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={() => setActiveLink(link.label)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeLink === link.label
                ? 'bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/40'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/30 border border-transparent'
            }`}
          >
            <span className={`${activeLink === link.label ? 'text-sidebar-primary' : 'text-muted-foreground'}`}>
              {link.icon}
            </span>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border text-xs text-muted-foreground">
        <p className="text-center">FinOps v2.1.0</p>
      </div>
    </aside>
  )
}
