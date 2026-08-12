import React from 'react'

type BadgeVariant = 'default' | 'green' | 'red' | 'gold' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#F5F4F0', color: '#6B6760' },
  green:   { background: 'rgba(26,158,92,0.10)', color: '#1A9E5C' },
  red:     { background: 'rgba(224,28,36,0.10)', color: '#E01C24' },
  gold:    { background: 'rgba(184,134,11,0.10)', color: '#B8860B' },
  muted:   { background: '#F5F4F0', color: '#6B6760' },
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
        borderRadius: '999px', fontSize: '11px', fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        ...BADGE_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
