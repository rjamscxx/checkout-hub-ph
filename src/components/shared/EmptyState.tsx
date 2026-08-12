interface EmptyStateProps {
  emoji?: string
  message: string
}

export function EmptyState({ emoji = '📦', message }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '64px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: '40px', lineHeight: 1 }}>{emoji}</span>
      <p style={{ fontSize: '14px', color: '#6B6760', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{message}</p>
    </div>
  )
}
