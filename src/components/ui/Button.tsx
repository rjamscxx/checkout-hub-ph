import React from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: { background: '#E01C24', color: '#fff' },
  ghost:   { background: 'transparent', color: '#6B6760' },
  danger:  { background: 'rgba(224,28,36,0.10)', color: '#E01C24', border: '1px solid rgba(224,28,36,0.28)' },
  outline: { background: 'transparent', color: '#1A1917', border: '1px solid #E8E5DF' },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { fontSize: '12px', padding: '5px 11px' },
  md: { fontSize: '13px', padding: '7px 14px' },
  lg: { fontSize: '15px', padding: '10px 20px' },
}

export function Button({ variant = 'primary', size = 'md', style, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        fontWeight: 600, borderRadius: '10px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s', fontFamily: 'Inter, system-ui, sans-serif',
        whiteSpace: 'nowrap',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
