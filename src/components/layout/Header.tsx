interface HeaderProps {
  storeName?: string
  right?: React.ReactNode
}

export function Header({ storeName = 'Checkout Hub', right }: HeaderProps) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: '#fff', borderBottom: '1px solid #E8E5DF',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 16px', height: '56px', flexShrink: 0,
      }}
    >
      <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
      <span style={{ fontWeight: 600, color: '#1A1917', fontSize: '16px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {storeName}
      </span>
      {right}
    </header>
  )
}
