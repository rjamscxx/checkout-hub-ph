import React from 'react'
import { color } from '../../lib/theme'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, style, rows = 3, id, ...props }: TextareaProps) {
  const generated = React.useId()
  const areaId = id ?? generated
  const errorId = `${areaId}-error`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={areaId} style={{ fontSize: '12px', fontWeight: 500, color: color.muted }}>
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        style={{
          width: '100%', background: color.surface2,
          border: `1px solid ${error ? color.accent : color.border}`,
          borderRadius: '8px', padding: '8px 10px', fontSize: '14px', color: color.ink,
          outline: 'none', boxSizing: 'border-box', resize: 'vertical',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
