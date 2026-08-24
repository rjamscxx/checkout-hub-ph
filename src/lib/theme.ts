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

/**
 * One surface recipe for every card, stat tile, section, and list row.
 * Replaces the hand-rolled bg/border/radius/shadow that had drifted
 * (12px vs 14px radius, inline boxShadow strings) across the pages.
 */
export const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg - 2, // 14 — the app-wide card corner
  boxShadow: shadow.sm,
}

/**
 * Two lines, then ellipsis — for names in narrow cards and list rows.
 *
 * A single-line `whiteSpace: nowrap` clamp reads fine on a desktop and then
 * crushes a product name down to "Lucky …" in a 300px column on a phone,
 * which is useless right after you have searched for it.
 */
export const clamp2: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

/**
 * Shared content-column widths for single-stack pages so forms and
 * summaries stop stretching full-bleed on wide screens — capped and
 * left-anchored (never centered).
 */
export const column = { form: 720, prose: 640 } as const
