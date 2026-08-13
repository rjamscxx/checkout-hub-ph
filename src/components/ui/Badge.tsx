import React from 'react'

type BadgeVariant = 'default' | 'green' | 'red' | 'gold' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--color-surface2)', color: 'var(--color-muted)' },
  green:   { background: 'var(--color-green-dim)', color: 'var(--color-green)' },
  red:     { background: 'var(--color-accent-dim)', color: 'var(--color-accent)' },
  gold:    { background: 'var(--color-gold-dim)', color: 'var(--color-gold)' },
  muted:   { background: 'var(--color-surface2)', color: 'var(--color-muted)' },
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
        borderRadius: '999px', fontSize: '11px', fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        ...BADGE_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
