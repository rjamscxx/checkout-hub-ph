import { AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { color, radius, space } from '../../lib/theme'
import type { DuplicateGroup } from '../../lib/catalog'

interface DuplicateAlertProps {
  groups: DuplicateGroup[]
  /** True while the list is filtered down to just the duplicates. */
  reviewing: boolean
  onToggleReview: () => void
}

/** Names of the colliding items, trimmed so the alert stays one or two lines. */
function summarize(groups: DuplicateGroup[]): string {
  const shown = groups.slice(0, 3).map(g => g.name)
  const rest = groups.length - shown.length
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
}

/**
 * Warns that the same item was entered more than once — the catalog still
 * works, so this nudges rather than blocks, and offers to filter down to the
 * offenders so they can be merged or deleted.
 */
export function DuplicateAlert({ groups, reviewing, onToggleReview }: DuplicateAlertProps) {
  if (!groups.length) return null

  const items = groups.reduce((n, g) => n + g.products.length, 0)

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', gap: space[3], flexWrap: 'wrap',
        background: color.goldDim,
        border: `1px solid ${color.gold}`,
        borderRadius: radius.md,
        padding: `${space[3]}px ${space[4]}px`,
      }}
    >
      <AlertTriangle size={17} strokeWidth={2} aria-hidden="true" style={{ color: color.gold, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: '180px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: color.ink }}>
          {groups.length === 1
            ? 'One item is in your catalog twice'
            : `${groups.length} items are in your catalog more than once`}
          <span style={{ fontWeight: 500, color: color.muted }}> · {items} entries</span>
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: color.muted, textWrap: 'pretty' }}>
          {summarize(groups)}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onToggleReview} style={{ flexShrink: 0 }}>
        {reviewing ? 'Show all' : 'Review'}
      </Button>
    </div>
  )
}
