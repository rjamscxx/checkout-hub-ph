/**
 * Single source of truth for design tokens.
 * Values are CSS variables (defined in index.css) so the whole app themes at
 * runtime — light/dark is just a `data-theme` swap on <html>.
 */
import type { CSSProperties } from 'react'

export const font = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"

export const color = {
  bg:        'var(--color-bg)',
  surface:   'var(--color-surface)',
  surface2:  'var(--color-surface2)',
  border:    'var(--color-border)',
  border2:   'var(--color-border2)',
  glass:     'var(--color-glass)',

  ink:       'var(--color-ink)',
  ink2:      'var(--color-ink2)',
  muted:     'var(--color-muted)',

  accent:      'var(--color-accent)',
  accentHover: 'var(--color-accent-hover)',
  accentDim:   'var(--color-accent-dim)',
  onAccent:    'var(--color-on-accent)',

  green:     'var(--color-green)',
  greenDim:  'var(--color-green-dim)',
  gold:      'var(--color-gold)',
  goldDim:   'var(--color-gold-dim)',
} as const

export const radius = { sm: 7, md: 11, lg: 16, xl: 20 } as const

export const shadow = {
  xs: '0 1px 2px rgba(var(--shadow-tint),0.05)',
  sm: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)',
  md: '0 3px 10px rgba(var(--shadow-tint),0.08), 0 1px 3px rgba(var(--shadow-tint),0.05)',
  lg: '0 8px 24px rgba(var(--shadow-tint),0.12), 0 2px 6px rgba(var(--shadow-tint),0.07)',
} as const

/** 4px base spacing scale — use for consistent rhythm. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const

/** Tabular figures for money/data columns (matches .price util). */
export const numeric: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum'",
  letterSpacing: '-0.01em',
}
