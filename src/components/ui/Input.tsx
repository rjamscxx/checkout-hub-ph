import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B6760', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', background: '#F5F4F0', border: `1px solid ${error ? '#E01C24' : '#E8E5DF'}`,
          borderRadius: '6px', padding: '8px 10px', fontSize: '14px', color: '#1A1917',
          outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#E01C24'; e.currentTarget.style.background = '#fff' }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? '#E01C24' : '#E8E5DF'; e.currentTarget.style.background = '#F5F4F0' }}
        {...props}
      />
      {error && <span style={{ fontSize: '11px', color: '#E01C24' }}>{error}</span>}
    </div>
  )
}
