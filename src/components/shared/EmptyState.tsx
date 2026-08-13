import type { LucideIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { color, font } from '../../lib/theme'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
  action?: { label: string; onClick: () => void }
}

/** Consistent empty state — an icon (never emoji) and one clear next action. */
export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ display: 'grid', placeItems: 'center', width: '52px', height: '52px', borderRadius: '50%', background: color.accentDim, color: color.accent }}>
        <Icon size={24} strokeWidth={1.7} />
      </div>
      <div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: color.ink, margin: 0, fontFamily: font, textWrap: 'balance' }}>{title}</p>
        {message && <p style={{ fontSize: '13px', color: color.muted, margin: '4px 0 0', fontFamily: font, maxWidth: '30ch', textWrap: 'pretty' }}>{message}</p>}
      </div>
      {action && <Button size="sm" onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
