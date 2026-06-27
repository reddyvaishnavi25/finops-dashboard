import { PageShell } from '@/components/page-shell'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="Configuration and preferences">
      <div
        className="rounded-xl p-12 flex flex-col items-center gap-4 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(20,30,60,0.5) 0%, rgba(40,20,80,0.2) 100%)',
          border: '1px solid rgba(136,100,255,0.15)',
        }}
      >
        <Settings className="w-10 h-10 text-muted-foreground" />
        <p className="text-lg font-semibold text-muted-foreground">Settings coming soon</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Future: alert thresholds, budget caps per tenant, Slack/email notifications, API key management.
        </p>
      </div>
    </PageShell>
  )
}
