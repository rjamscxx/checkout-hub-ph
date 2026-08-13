/**
 * Single source of truth for design tokens.
 * Mirrors the CSS variables in index.css (@theme). Import these in inline-style
 * components so the palette never drifts (prevents the dual-palette slop).
 */
import type { CSSProperties } from 'react'

export const font = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"

export const color = {
  bg:        '#F7F6F3',
  surface:   '#FFFFFF',
  surface2:  '#F2F1EE',
  border:    '#E6E3DC',
  border2:   '#D8D4CC',

  ink:       '#18171A',
  ink2:      '#3D3B42',
  muted:     '#79767F',

  accent:      '#D91A22',
  accentHover: '#B8161E',
  accentDim:   'rgba(217,26,34,0.09)',

  green:     '#167A46',
  greenDim:  'rgba(22,122,70,0.10)',
  gold:      '#9A6F0A',
  goldDim:   'rgba(154,111,10,0.10)',
} as const

export const radius = { sm: 7, md: 11, lg: 16, xl: 20 } as const

export const shadow = {
  xs: '0 1px 2px rgba(24,23,26,0.05)',
  sm: '0 1px 3px rgba(24,23,26,0.07), 0 1px 2px rgba(24,23,26,0.04)',
  md: '0 3px 10px rgba(24,23,26,0.08), 0 1px 3px rgba(24,23,26,0.05)',
  lg: '0 8px 24px rgba(24,23,26,0.10), 0 2px 6px rgba(24,23,26,0.06)',
} as const

/** 4px base spacing scale — use for consistent rhythm. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const

/** Tabular figures for money/data columns (matches .price util). */
export const numeric: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum'",
  letterSpacing: '-0.01em',
}
