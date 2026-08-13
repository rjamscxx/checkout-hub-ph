/**
 * Shared page frame. Every tab renders through these primitives so padding,
 * heading spec, section surfaces, and stat tiles line up to one grid instead
 * of each page hand-rolling its own. Elements are left-anchored, not centered.
 */
import type { CSSProperties, ReactNode } from 'react'
import { color, card, numeric, space } from '../../lib/theme'

/* ---- SectionLabel -------------------------------------------------------- */

/** Standalone group label for grids that don't need a card wrapper. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: '11px', fontWeight: 700, color: color.muted,
        textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
      }}
    >
      {children}
    </p>
  )
}

/* ---- Page ------------------------------------------------------------- */

interface PageProps {
  children: ReactNode
  /** Cap single-column pages (forms, summaries) — left-anchored, never centered. */
  maxWidth?: number
  gap?: number
}

export function Page({ children, maxWidth, gap = 18 }: PageProps) {
  return (
    <div
      style={{
        padding: 'clamp(16px, 2.5vw, 28px)',
        display: 'flex',
        flexDirection: 'column',
        gap,
        width: '100%',
        maxWidth: maxWidth ?? undefined,
      }}
    >
      {children}
    </div>
  )
}

/* ---- PageHeader ------------------------------------------------------- */

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: subtitle ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: space[3],
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontWeight: 700,
            color: color.ink,
            fontSize: '20px',
            margin: 0,
            letterSpacing: '-0.02em',
            textWrap: 'balance',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: '13px', color: color.muted, margin: '3px 0 0', textWrap: 'pretty' }}>
            {subtitle}
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

/* ---- Section ---------------------------------------------------------- */

interface SectionProps {
  title?: string
  children: ReactNode
  style?: CSSProperties
}

const sectionTitle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: color.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: 0,
}

/** A titled surface card — the recipe Settings/Reports/Expenses had each rebuilt. */
export function Section({ title, children, style }: SectionProps) {
  return (
    <div style={{ ...card, padding: space[5], display: 'flex', flexDirection: 'column', gap: space[3], ...style }}>
      {title && <p style={sectionTitle}>{title}</p>}
      {children}
    </div>
  )
}

/* ---- Stats ------------------------------------------------------------ */

export function StatGrid({ children, min = 150 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: space[2] }}>
      {children}
    </div>
  )
}

type Tone = 'ink' | 'green' | 'gold' | 'muted' | 'accent'
const TONE: Record<Tone, string> = {
  ink: color.ink,
  green: color.green,
  gold: color.gold,
  muted: color.muted,
  accent: color.accent,
}

/** Left-aligned metric tile: label over value, one number size, tabular figures. */
export function StatCard({ label, value, tone = 'ink' }: { label: string; value: string | number; tone?: Tone }) {
  return (
    <div style={{ ...card, padding: space[3], display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: '13px', color: color.muted }}>{label}</span>
      <span
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: TONE[tone],
          ...numeric,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}
