import React from 'react'
import { color } from '../../lib/theme'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: color.muted }}>
          {label}
        </label>
      )}
      <input
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
      {error && <span style={{ fontSize: '11px', color: color.accent }}>{error}</span>}
    </div>
  )
}
