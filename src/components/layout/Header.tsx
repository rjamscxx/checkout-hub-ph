const F = "'Plus Jakarta Sans', system-ui, sans-serif"

interface HeaderProps {
  storeName?: string
  right?: React.ReactNode
}

export function Header({ storeName = 'Checkout Hub', right }: HeaderProps) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(230,227,220,0.9)',
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '0 16px', height: '54px', flexShrink: 0,
      boxShadow: '0 1px 0 rgba(24,23,26,0.04)',
    }}>
      <img src="/logo.png" alt={storeName} style={{ height: '29px', width: 'auto', objectFit: 'contain' }} />
      <span style={{
        fontWeight: 700, color: '#18171A', fontSize: '15px',
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: F, letterSpacing: '-0.015em',
      }}>
        {storeName}
      </span>
      {right}
    </header>
  )
}
