import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, Download, Upload, X } from 'lucide-react'
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
  const [gcashQr, setGcashQr] = useState('')
  const [mayaQr, setMayaQr] = useState('')
  const [saved, setSaved] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const gcashRef = useRef<HTMLInputElement>(null)
  const mayaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSetting('store_name', 'Checkout Hub').then(setStoreName)
    getSetting('store_tagline', '').then(setTagline)
    getSetting('order_contact', '').then(setOrderContact)
    getSetting('invoice_prefix', 'INV').then(setInvoicePrefix)
    getSetting('margin_floor', String(DEFAULT_MARGIN_FLOOR)).then(setMarginFloor)
    getSetting('gcash_qr', '').then(setGcashQr)
    getSetting('maya_qr', '').then(setMayaQr)
  }, [])

  function handleQrUpload(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => setter(ev.target?.result as string ?? '')
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  async function handleSave() {
    await setSetting('store_name', storeName)
    await setSetting('store_tagline', tagline)
    await setSetting('order_contact', orderContact)
    await setSetting('invoice_prefix', invoicePrefix)
    await setSetting('margin_floor', String(Math.max(0, Math.min(100, Number(marginFloor) || 0))))
    await setSetting('gcash_qr', gcashQr)
    await setSetting('maya_qr', mayaQr)
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
      </Section>

      <Section title="Payment QR Codes">
        <p style={helper}>Upload your GCash and Maya QR codes — they'll appear on printed invoices so customers can scan to pay.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {(['gcash', 'maya'] as const).map(method => {
            const label = method === 'gcash' ? 'GCash QR' : 'Maya QR'
            const qr = method === 'gcash' ? gcashQr : mayaQr
            const setter = method === 'gcash' ? setGcashQr : setMayaQr
            const ref = method === 'gcash' ? gcashRef : mayaRef
            return (
              <div key={method} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: color.muted, margin: 0 }}>{label}</p>
                {qr ? (
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <img src={qr} alt={label} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'contain', borderRadius: '8px', border: `1px solid ${color.border}`, background: '#fff' }} />
                    <button
                      onClick={() => setter('')}
                      aria-label={`Remove ${label}`}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: color.accent, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    ><X size={12} strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => ref.current?.click()}
                    style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', border: `1.5px dashed ${color.border}`, background: color.surface2, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: color.muted, fontSize: '12px', fontWeight: 500 }}
                  >
                    <Upload size={20} strokeWidth={1.5} />
                    Upload
                  </button>
                )}
                <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQrUpload(setter)} />
              </div>
            )
          })}
        </div>
      </Section>

      <Button size="lg" onClick={handleSave} style={{ width: '100%' }}>
        {saved ? <><Check size={15} strokeWidth={2.4} /> Saved</> : 'Save settings'}
      </Button>

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
