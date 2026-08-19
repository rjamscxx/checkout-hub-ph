import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { color, radius } from '../../lib/theme'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Describes what is being searched, e.g. "Search products". */
  label: string
}

/**
 * Search field — same surface recipe as `Input`, with a leading magnifier and
 * a clear button that appears once there is something to clear.
 */
export function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <Search
        size={15}
        strokeWidth={1.9}
        aria-hidden="true"
        style={{ position: 'absolute', left: '11px', color: color.muted, pointerEvents: 'none' }}
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange('') } }}
        style={{
          width: '100%',
          background: focused ? color.surface : color.surface2,
          border: `1px solid ${focused ? color.accent : color.border}`,
          borderRadius: radius.sm + 1,
          padding: '8px 34px',
          fontSize: '14px',
          color: color.ink,
          outline: 'none',
          boxSizing: 'border-box',
          // the type=search widget draws its own clear cross on some browsers
          appearance: 'none',
        }}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: '7px', display: 'grid', placeItems: 'center',
            width: '22px', height: '22px', borderRadius: '50%', border: 'none',
            background: 'transparent', color: color.muted, cursor: 'pointer',
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
