import React from 'react'

type BadgeVariant = 'default' | 'green' | 'red' | 'gold' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#F2F1EE', color: '#79767F' },
  green:   { background: 'rgba(22,122,70,0.10)', color: '#167A46' },
  red:     { background: 'rgba(217,26,34,0.10)', color: '#D91A22' },
  gold:    { background: 'rgba(154,111,10,0.10)', color: '#9A6F0A' },
  muted:   { background: '#F2F1EE', color: '#79767F' },
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
