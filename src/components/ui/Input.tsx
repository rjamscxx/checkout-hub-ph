import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-muted)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', background: 'var(--color-surface2)', border: `1px solid ${error ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: '6px', padding: '8px 10px', fontSize: '14px', color: 'var(--color-ink)',
          outline: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface)' }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--color-accent)' : 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface2)' }}
        {...props}
      />
      {error && <span style={{ fontSize: '11px', color: 'var(--color-accent)' }}>{error}</span>}
    </div>
  )
}
