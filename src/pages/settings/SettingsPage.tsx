import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getSetting, setSetting } from '../../db'
import { exportBackup, importBackup } from '../../lib/backup'

export function SettingsPage() {
  const [storeName, setStoreName] = useState('')
  const [invoicePrefix, setInvoicePrefix] = useState('INV')
  const [saved, setSaved] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSetting('store_name', 'Checkout Hub').then(setStoreName)
    getSetting('invoice_prefix', 'INV').then(setInvoicePrefix)
  }, [])

  async function handleSave() {
    await setSetting('store_name', storeName)
    await setSetting('invoice_prefix', invoicePrefix)
    // Trigger storage event so App.tsx re-reads store name
    window.dispatchEvent(new Event('settings-updated'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(file)
      alert('Backup restored successfully. The page will reload.')
      window.location.reload()
    } catch {
      alert('Failed to restore backup. Please check the file format.')
    }
    // Reset input
    if (importRef.current) importRef.current.value = ''
  }

  const section: React.CSSProperties = {
    background: '#fff', borderRadius: '12px', border: '1px solid #E8E5DF', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#6B6760', textTransform: 'uppercase',
    letterSpacing: '0.5px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif',
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Settings</h1>

      {/* Store info */}
      <div style={section}>
        <p style={sectionTitle}>Store Info</p>
        <Input label="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. RJ Merchandise" />
        <Input label="Invoice Prefix" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV" />
        <Button onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </div>

      {/* Data backup */}
      <div style={section}>
        <p style={sectionTitle}>Data Backup</p>
        <p style={{ fontSize: '13px', color: '#6B6760', margin: 0, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5 }}>
          Export a JSON file with all your products, orders, profits, and expenses. Import it anytime to restore your data.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={exportBackup}>
            ⬇ Export Backup
          </Button>
          <Button variant="ghost" style={{ flex: 1 }} onClick={() => importRef.current?.click()}>
            ⬆ Restore Backup
          </Button>
        </div>
        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* About */}
      <div style={section}>
        <p style={sectionTitle}>About</p>
        <p style={{ fontSize: '13px', color: '#6B6760', margin: 0, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>
          Checkout Hub PH v2.0<br />
          Local-first PWA — all data on your device<br />
          Works offline, no account needed
        </p>
      </div>
    </div>
  )
}
