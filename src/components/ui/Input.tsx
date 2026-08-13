import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#79767F', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', background: '#F2F1EE', border: `1px solid ${error ? '#D91A22' : '#E6E3DC'}`,
          borderRadius: '6px', padding: '8px 10px', fontSize: '14px', color: '#18171A',
          outline: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#D91A22'; e.currentTarget.style.background = '#fff' }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? '#D91A22' : '#E6E3DC'; e.currentTarget.style.background = '#F2F1EE' }}
        {...props}
      />
      {error && <span style={{ fontSize: '11px', color: '#D91A22' }}>{error}</span>}
    </div>
  )
}
