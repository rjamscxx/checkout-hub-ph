import React from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const F = "'Plus Jakarta Sans', system-ui, sans-serif"

const VARIANT_BASE: Record<Variant, React.CSSProperties> = {
  primary: { background: '#D91A22', color: '#fff' },
  ghost:   { background: 'transparent', color: '#79767F' },
  danger:  { background: 'rgba(217,26,34,0.08)', color: '#D91A22', border: '1px solid rgba(217,26,34,0.22)' },
  outline: { background: 'transparent', color: '#18171A', border: '1px solid #E6E3DC' },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { fontSize: '12px', padding: '5px 12px', height: '30px' },
  md: { fontSize: '13px', padding: '0 15px', height: '36px' },
  lg: { fontSize: '15px', padding: '0 22px', height: '44px' },
}

export function Button({ variant = 'primary', size = 'md', style, disabled, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, children, ...props }: ButtonProps) {
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)

  const hoverOverride: React.CSSProperties = hovered && !disabled
    ? variant === 'primary'
      ? { background: '#B8161E' }
      : variant === 'ghost'
      ? { background: '#F2F1EE', color: '#18171A' }
      : { opacity: 0.85 }
    : {}

  const pressStyle: React.CSSProperties = pressed && !disabled ? { transform: 'scale(0.97)' } : {}

  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        fontWeight: 600, borderRadius: '10px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background 0.12s, opacity 0.12s, transform 0.08s',
        fontFamily: F, whiteSpace: 'nowrap',
        ...VARIANT_BASE[variant],
        ...SIZE_STYLES[size],
        ...hoverOverride,
        ...pressStyle,
        ...style,
      }}
      disabled={disabled}
      onMouseEnter={e => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={e => { setHovered(false); setPressed(false); onMouseLeave?.(e) }}
      onMouseDown={e => { setPressed(true); onMouseDown?.(e) }}
      onMouseUp={e => { setPressed(false); onMouseUp?.(e) }}
      {...props}
    >
      {children}
    </button>
  )
}
