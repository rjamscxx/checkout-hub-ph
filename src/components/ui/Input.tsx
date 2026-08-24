import React from 'react'
import { color } from '../../lib/theme'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, style, id, ...props }: InputProps) {
  // The label used to sit next to the field without being tied to it, so a
  // screen reader announced an unnamed box and `getByLabel` found nothing.
  const generated = React.useId()
  const inputId = id ?? generated
  const errorId = `${inputId}-error`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '12px', fontWeight: 500, color: color.muted }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        style={{
          width: '100%', background: color.surface2,
          border: `1px solid ${error ? color.accent : color.border}`,
          borderRadius: '8px', padding: '8px 10px', fontSize: '14px', color: color.ink,
          outline: 'none', boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = color.accent; e.currentTarget.style.background = color.surface }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? color.accent : color.border; e.currentTarget.style.background = color.surface2 }}
        {...props}
      />
      {error && <span id={errorId} style={{ fontSize: '11px', color: color.accent }}>{error}</span>}
    </div>
  )
}
