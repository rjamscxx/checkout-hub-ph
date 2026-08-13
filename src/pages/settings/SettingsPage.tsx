import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, Download, Upload } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Page, PageHeader, Section } from '../../components/layout/Page'
import { getSetting, setSetting } from '../../db'
import { exportBackup, importBackup } from '../../lib/backup'
import { DEFAULT_MARGIN_FLOOR } from '../../hooks/useOrders'
import { color, column } from '../../lib/theme'

export function SettingsPage() {
  const [storeName, setStoreName] = useState('')
  const [tagline, setTagline] = useState('')
  const [orderContact, setOrderContact] = useState('')
  const [invoicePrefix, setInvoicePrefix] = useState('INV')
  const [marginFloor, setMarginFloor] = useState(String(DEFAULT_MARGIN_FLOOR))
  const [saved, setSaved] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSetting('store_name', 'Checkout Hub').then(setStoreName)
    getSetting('store_tagline', '').then(setTagline)
    getSetting('order_contact', '').then(setOrderContact)
    getSetting('invoice_prefix', 'INV').then(setInvoicePrefix)
    getSetting('margin_floor', String(DEFAULT_MARGIN_FLOOR)).then(setMarginFloor)
  }, [])

  async function handleSave() {
    await setSetting('store_name', storeName)
    await setSetting('store_tagline', tagline)
    await setSetting('order_contact', orderContact)
    await setSetting('invoice_prefix', invoicePrefix)
    await setSetting('margin_floor', String(Math.max(0, Math.min(100, Number(marginFloor) || 0))))
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
    if (importRef.current) importRef.current.value = ''
  }

  const helper: CSSProperties = { fontSize: '13px', color: color.muted, margin: 0, lineHeight: 1.5, textWrap: 'pretty' }

  return (
    <Page maxWidth={column.form}>
      <PageHeader title="Settings" />

      <Section title="Store">
        <Input label="Store name" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. RJ General Merchandise" />
        <Input label="Tagline" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Legit online seller · Metro Manila" />
        <Input label="Order contact" value={orderContact} onChange={e => setOrderContact(e.target.value)} placeholder="e.g. m.me/rjstore · 0917 000 0000" />
        <p style={helper}>Shown on the customer catalog so buyers know how to reach you.</p>
        <Input label="Invoice prefix" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV" />
      </Section>

      <Section title="Profit">
        <Input
          label="Minimum margin (%)"
          type="number" min="0" max="100"
          value={marginFloor}
          onChange={e => setMarginFloor(e.target.value)}
        />
        <p style={helper}>Orders below this margin get flagged in amber so you never sell too cheap by accident.</p>
        <Button onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
          {saved ? <><Check size={15} strokeWidth={2.4} /> Saved</> : 'Save settings'}
        </Button>
      </Section>

      <Section title="Data backup">
        <p style={helper}>Export a JSON file with all your products, orders, profits, and expenses. Import it anytime to restore.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={exportBackup}>
            <Download size={15} strokeWidth={1.9} /> Export
          </Button>
          <Button variant="ghost" style={{ flex: 1 }} onClick={() => importRef.current?.click()}>
            <Upload size={15} strokeWidth={1.9} /> Restore
          </Button>
        </div>
        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </Section>

      <Section title="About">
        <p style={{ ...helper, lineHeight: 1.6 }}>
          Checkout Hub PH v2.0<br />
          Local-first PWA — all data lives on your device<br />
          Works offline, no account needed
        </p>
      </Section>
    </Page>
  )
}
