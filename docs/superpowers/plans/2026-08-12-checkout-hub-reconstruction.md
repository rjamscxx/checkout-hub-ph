# Checkout Hub PH — Full Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct Checkout Hub PH as a modern local-first PWA (Vite + React + TypeScript + Tailwind v4 + Dexie.js) with Light Retail Console design, replacing the 460KB single-file vanilla app at the same Vercel URL (`checkout-hub-ph.vercel.app`).

**Architecture:** All data in IndexedDB via Dexie.js — offline-first, no server, no auth. React handles 9 tab pages with a bottom nav on mobile. Screenshot Mode on the Catalog tab hides all chrome and renders a full-bleed product board for customers to browse (then RJ screenshots it to share on Messenger). Supabase cloud sync can be added later without breaking offline behaviour.

**Tech Stack:** Node 24, Vite 6, React 19, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, Dexie.js 4 + dexie-react-hooks, Framer Motion 11, vite-plugin-pwa, Vitest 3 + @testing-library/react + fake-indexeddb

---

## File Map

```
E:\SaaS\CHECKOUTHUBPH\
├── public/
│   ├── logo.png                  ← already extracted from v6
│   ├── icon-192.png              ← PWA icon (generate from logo)
│   └── icon-512.png
├── src/
│   ├── main.tsx                  ← React root mount
│   ├── App.tsx                   ← Tab router + layout shell
│   ├── index.css                 ← Tailwind v4 @import + @theme tokens
│   ├── db/
│   │   └── index.ts              ← Dexie schema, db singleton, all types
│   ├── lib/
│   │   ├── utils.ts              ← cn(), formatPHP(), formatDate(), genRef()
│   │   ├── csv.ts                ← CSV export helpers
│   │   └── backup.ts             ← JSON export/import
│   ├── hooks/
│   │   ├── useProducts.ts        ← useLiveQuery wrappers for products
│   │   ├── useOrders.ts
│   │   ├── useInvoices.ts
│   │   ├── useProfits.ts
│   │   └── useExpenses.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx        ← base button variants
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Dialog.tsx        ← modal wrapper
│   │   │   └── Sheet.tsx         ← bottom sheet / drawer
│   │   ├── layout/
│   │   │   ├── Header.tsx        ← logo + store name + action slot
│   │   │   └── BottomNav.tsx     ← 5-tab bar + More sheet
│   │   └── shared/
│   │       ├── PhotoGallery.tsx  ← swipeable Framer Motion gallery
│   │       ├── PhotoUploader.tsx ← multi-photo pick (1-8)
│   │       └── EmptyState.tsx
│   └── pages/
│       ├── catalog/
│       │   ├── CatalogPage.tsx
│       │   ├── CatalogCard.tsx
│       │   └── ScreenshotMode.tsx
│       ├── orders/
│       │   ├── OrdersPage.tsx
│       │   ├── OrderCard.tsx
│       │   └── QuickAddOrder.tsx
│       ├── products/
│       │   ├── ProductsPage.tsx
│       │   ├── ProductListItem.tsx
│       │   └── ProductForm.tsx
│       ├── inventory/
│       │   └── InventoryPage.tsx
│       ├── invoice/
│       │   ├── InvoicePage.tsx
│       │   └── InvoicePrint.tsx
│       ├── profits/
│       │   └── ProfitsPage.tsx
│       ├── expenses/
│       │   └── ExpensesPage.tsx
│       ├── reports/
│       │   └── ReportsPage.tsx
│       └── settings/
│           └── SettingsPage.tsx
├── index.html                    ← Vite entry (replaces old single-file)
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── vercel.json                   ← updated for Vite build
└── vitest.setup.ts
```

---

## Task 1: Scaffold — Vite + React + TS + Tailwind + All Deps

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `vercel.json`, `vitest.setup.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create feature branch**

```bash
cd /e/SaaS/CHECKOUTHUBPH
git checkout -b feat/vite-rebuild
```

- [ ] **Step 2: Archive the old single-file app**

```bash
mv index.html _archive-v6-index.html
mv sw.js _archive-sw.js
mv manifest.webmanifest _archive-manifest.webmanifest
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "checkout-hub-ph",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "dexie": "^4.0.10",
    "dexie-react-hooks": "^1.1.7",
    "framer-motion": "^11.18.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.11",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.5.2",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.11",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: ~60s install, no peer dep errors.

- [ ] **Step 5: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Checkout Hub PH',
        short_name: 'CheckoutHub',
        description: 'Business OS for your general merchandise store',
        theme_color: '#E01C24',
        background_color: '#FAFAF8',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 6: Write `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Write `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

Write `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Write `vitest.setup.ts`**

```ts
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#E01C24" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <title>Checkout Hub PH</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 10: Write `src/index.css`**

```css
@import 'tailwindcss';

@theme {
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface2: #F5F4F0;
  --color-border: #E8E5DF;
  --color-ink: #1A1917;
  --color-muted: #6B6760;
  --color-accent: #E01C24;
  --color-accent-hover: #C01820;
  --color-accent-dim: rgba(224,28,36,0.10);
  --color-green: #1A9E5C;
  --color-green-dim: rgba(26,158,92,0.10);
  --color-gold: #B8860B;
  --color-gold-dim: rgba(184,134,11,0.10);

  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

@layer base {
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; -webkit-tap-highlight-color: transparent; }
  body { background: var(--color-bg); color: var(--color-ink); font-family: var(--font-body); min-height: 100dvh; }
}
```

- [ ] **Step 11: Write placeholder `src/App.tsx`**

```tsx
export default function App() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-ink text-lg font-semibold">Checkout Hub PH — v2.0</p>
    </div>
  )
}
```

- [ ] **Step 12: Update `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

- [ ] **Step 13: Update `.gitignore` — add dist and node_modules**

Append to `.gitignore`:
```
node_modules/
dist/
*.local
.env
```

- [ ] **Step 14: Run dev server and verify**

```bash
npm run dev
```

Expected: Vite dev server on `http://localhost:5173`, page loads with "Checkout Hub PH — v2.0" text on warm paper white background.

- [ ] **Step 15: Run TypeScript check**

```bash
npx tsc -b --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/ vitest.setup.ts vercel.json public/logo.png .gitignore _archive-v6-index.html _archive-sw.js _archive-manifest.webmanifest
git commit -m "scaffold: Vite + React 19 + TS + Tailwind v4 + Dexie + PWA"
```

---

## Task 2: DB Schema, Types, and Utilities

**Files:**
- Create: `src/db/index.ts`, `src/lib/utils.ts`, `src/lib/csv.ts`, `src/lib/backup.ts`
- Test: `src/db/index.test.ts`, `src/lib/utils.test.ts`, `src/lib/csv.test.ts`

- [ ] **Step 1: Write `src/db/index.ts`**

```ts
import Dexie, { type EntityTable } from 'dexie'

export interface Product {
  id?: number
  name: string
  description: string
  category: string
  costPrice: number
  sellPrice: number
  stock: number
  availableToday: boolean
  photos: string[]          // base64 strings, max 8
  expiryDate?: string       // ISO date string, optional
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: number
  name: string
  qty: number
  price: number
}

export interface Order {
  id?: number
  ref: string               // e.g. ORD-0042
  customerName: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'done'
  notes: string
  createdAt: string
}

export interface InvoiceItem {
  description: string
  qty: number
  price: number
}

export interface Invoice {
  id?: number
  invoiceNo: string
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  paidVia: string
  notes: string
  createdAt: string
}

export interface ProfitEntry {
  id?: number
  source: 'order' | 'invoice' | 'manual'
  ref: string
  revenue: number
  cost: number
  profit: number
  date: string              // ISO date string YYYY-MM-DD
}

export interface Expense {
  id?: number
  description: string
  amount: number
  category: string
  date: string              // ISO date string YYYY-MM-DD
}

export interface Settings {
  key: string
  value: string
}

class CheckoutHubDB extends Dexie {
  products!: EntityTable<Product, 'id'>
  orders!: EntityTable<Order, 'id'>
  invoices!: EntityTable<Invoice, 'id'>
  profits!: EntityTable<ProfitEntry, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  settings!: EntityTable<Settings, 'key'>

  constructor() {
    super('checkout_hub_v2')
    this.version(1).stores({
      products: '++id, name, category, availableToday, createdAt',
      orders: '++id, ref, status, createdAt',
      invoices: '++id, invoiceNo, createdAt',
      profits: '++id, source, date',
      expenses: '++id, category, date',
      settings: 'key',
    })
  }
}

export const db = new CheckoutHubDB()

// Settings helpers
export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await db.settings.get(key)
  return row?.value ?? fallback
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}
```

- [ ] **Step 2: Write `src/db/index.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './index'

beforeEach(async () => {
  await db.products.clear()
  await db.orders.clear()
})

describe('products', () => {
  it('adds and retrieves a product', async () => {
    const id = await db.products.add({
      name: 'Shampoo',
      description: '',
      category: 'Personal Care',
      costPrice: 50,
      sellPrice: 80,
      stock: 10,
      availableToday: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const product = await db.products.get(id)
    expect(product?.name).toBe('Shampoo')
    expect(product?.sellPrice).toBe(80)
  })
})

describe('orders', () => {
  it('adds an order with items', async () => {
    const id = await db.orders.add({
      ref: 'ORD-0001',
      customerName: 'Maria',
      items: [{ productId: 1, name: 'Shampoo', qty: 2, price: 80 }],
      total: 160,
      status: 'pending',
      notes: '',
      createdAt: new Date().toISOString(),
    })
    const order = await db.orders.get(id)
    expect(order?.ref).toBe('ORD-0001')
    expect(order?.items).toHaveLength(1)
  })
})

describe('getSetting / setSetting', () => {
  it('returns fallback for missing key', async () => {
    const { getSetting } = await import('./index')
    const val = await getSetting('store_name', 'My Store')
    expect(val).toBe('My Store')
  })

  it('stores and retrieves a setting', async () => {
    const { getSetting, setSetting } = await import('./index')
    await setSetting('store_name', 'RJ Merchandise')
    const val = await getSetting('store_name')
    expect(val).toBe('RJ Merchandise')
  })
})
```

- [ ] **Step 3: Run DB tests**

```bash
npm test -- src/db/index.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 4: Write `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPHP(amount: number): string {
  return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

let _orderSeq = 0
export function genOrderRef(): string {
  _orderSeq++
  return 'ORD-' + String(Date.now()).slice(-4) + String(_orderSeq).padStart(2, '0')
}

let _invSeq = 0
export function genInvoiceNo(prefix = 'INV'): string {
  _invSeq++
  return `${prefix}-${String(Date.now()).slice(-4)}${String(_invSeq).padStart(2, '0')}`
}
```

- [ ] **Step 5: Write `src/lib/utils.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { formatPHP, formatDate, todayISO, genOrderRef } from './utils'

describe('formatPHP', () => {
  it('formats zero', () => expect(formatPHP(0)).toBe('₱0.00'))
  it('formats thousands', () => expect(formatPHP(1500)).toBe('₱1,500.00'))
  it('formats decimals', () => expect(formatPHP(99.5)).toBe('₱99.50'))
})

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('genOrderRef', () => {
  it('starts with ORD-', () => expect(genOrderRef()).toMatch(/^ORD-/))
  it('generates unique refs', () => {
    const a = genOrderRef()
    const b = genOrderRef()
    expect(a).not.toBe(b)
  })
})

describe('formatDate', () => {
  it('parses ISO string to readable date', () => {
    const result = formatDate('2026-08-12T00:00:00.000Z')
    expect(result).toContain('Aug')
    expect(result).toContain('2026')
  })
})
```

- [ ] **Step 6: Write `src/lib/csv.ts`**

```ts
import type { Order, ProfitEntry, Expense } from '../db'

function escape(val: unknown): string {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function toCSV(rows: string[][]): string {
  return rows.map(r => r.map(escape).join(',')).join('\n')
}

export function ordersToCSV(orders: Order[]): string {
  const header = ['Ref', 'Customer', 'Items', 'Total', 'Status', 'Date']
  const rows = orders.map(o => [
    o.ref,
    o.customerName,
    o.items.map(i => `${i.name}×${i.qty}`).join(' | '),
    String(o.total),
    o.status,
    o.createdAt.slice(0, 10),
  ])
  return toCSV([header, ...rows])
}

export function profitsToCSV(entries: ProfitEntry[]): string {
  const header = ['Date', 'Source', 'Ref', 'Revenue', 'Cost', 'Profit']
  const rows = entries.map(e => [e.date, e.source, e.ref, String(e.revenue), String(e.cost), String(e.profit)])
  return toCSV([header, ...rows])
}

export function expensesToCSV(expenses: Expense[]): string {
  const header = ['Date', 'Description', 'Category', 'Amount']
  const rows = expenses.map(e => [e.date, e.description, e.category, String(e.amount)])
  return toCSV([header, ...rows])
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 7: Write `src/lib/csv.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { ordersToCSV, profitsToCSV } from './csv'
import type { Order, ProfitEntry } from '../db'

const sampleOrder: Order = {
  id: 1,
  ref: 'ORD-0001',
  customerName: 'Maria',
  items: [{ productId: 1, name: 'Shampoo', qty: 2, price: 80 }],
  total: 160,
  status: 'paid',
  notes: '',
  createdAt: '2026-08-12T10:00:00.000Z',
}

describe('ordersToCSV', () => {
  it('includes header row', () => {
    const csv = ordersToCSV([sampleOrder])
    expect(csv.split('\n')[0]).toBe('Ref,Customer,Items,Total,Status,Date')
  })

  it('outputs correct data row', () => {
    const csv = ordersToCSV([sampleOrder])
    const lines = csv.split('\n')
    expect(lines[1]).toContain('ORD-0001')
    expect(lines[1]).toContain('Maria')
    expect(lines[1]).toContain('160')
  })
})

const sampleProfit: ProfitEntry = {
  id: 1,
  source: 'order',
  ref: 'ORD-0001',
  revenue: 160,
  cost: 100,
  profit: 60,
  date: '2026-08-12',
}

describe('profitsToCSV', () => {
  it('outputs profit rows correctly', () => {
    const csv = profitsToCSV([sampleProfit])
    expect(csv).toContain('Revenue,Cost,Profit')
    expect(csv).toContain('160')
    expect(csv).toContain('60')
  })
})
```

- [ ] **Step 8: Write `src/lib/backup.ts`**

```ts
import { db } from '../db'

export async function exportBackup(): Promise<void> {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    products: await db.products.toArray(),
    orders: await db.orders.toArray(),
    invoices: await db.invoices.toArray(),
    profits: await db.profits.toArray(),
    expenses: await db.expenses.toArray(),
    settings: await db.settings.toArray(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `checkout-hub-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data.version || !data.products) throw new Error('Invalid backup file')

  await db.transaction('rw', db.products, db.orders, db.invoices, db.profits, db.expenses, db.settings, async () => {
    await db.products.clear()
    await db.orders.clear()
    await db.invoices.clear()
    await db.profits.clear()
    await db.expenses.clear()
    await db.settings.clear()

    if (data.products?.length) await db.products.bulkAdd(data.products)
    if (data.orders?.length) await db.orders.bulkAdd(data.orders)
    if (data.invoices?.length) await db.invoices.bulkAdd(data.invoices)
    if (data.profits?.length) await db.profits.bulkAdd(data.profits)
    if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses)
    if (data.settings?.length) await db.settings.bulkPut(data.settings)
  })
}
```

- [ ] **Step 9: Run all tests**

```bash
npm test
```

Expected: all tests pass (db + utils + csv).

- [ ] **Step 10: Commit**

```bash
git add src/db/ src/lib/ vitest.setup.ts
git commit -m "feat: Dexie schema, types, utils, CSV, backup"
```

---

## Task 3: Layout Shell — Header, BottomNav, App Router

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/ui/Sheet.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `src/components/ui/Sheet.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onClose, children, className }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn('fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 max-h-[85dvh] overflow-y-auto', className)}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Write `src/components/layout/Header.tsx`**

```tsx
interface HeaderProps {
  storeName?: string
  right?: React.ReactNode
}

export function Header({ storeName = 'Checkout Hub', right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border flex items-center gap-3 px-4 h-14 flex-shrink-0">
      <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      <span className="font-semibold text-ink text-base flex-1 truncate">{storeName}</span>
      {right}
    </header>
  )
}
```

- [ ] **Step 3: Write `src/components/layout/BottomNav.tsx`**

```tsx
import { cn } from '../../lib/utils'

export type TabId = 'catalog' | 'orders' | 'products' | 'inventory' | 'invoice' | 'profits' | 'expenses' | 'reports' | 'settings'

interface NavItem {
  id: TabId
  label: string
  icon: string
}

const PRIMARY_TABS: NavItem[] = [
  { id: 'catalog',   label: 'Catalog',   icon: '📸' },
  { id: 'orders',    label: 'Orders',    icon: '📋' },
  { id: 'products',  label: 'Products',  icon: '📦' },
  { id: 'inventory', label: 'Inventory', icon: '📊' },
  { id: 'invoice',   label: 'Invoice',   icon: '🧾' },
]

const MORE_TABS: NavItem[] = [
  { id: 'profits',  label: 'Profits',  icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'reports',  label: 'Reports',  icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const isMoreActive = MORE_TABS.some(t => t.id === active)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex safe-b">
      {PRIMARY_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
            active === tab.id ? 'text-accent' : 'text-muted'
          )}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="leading-none">{tab.label}</span>
        </button>
      ))}
      {/* More button cycles through remaining tabs */}
      <button
        onClick={() => {
          const currentMoreIdx = MORE_TABS.findIndex(t => t.id === active)
          const next = MORE_TABS[(currentMoreIdx + 1) % MORE_TABS.length]
          onChange(next.id)
        }}
        className={cn(
          'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
          isMoreActive ? 'text-accent' : 'text-muted'
        )}
      >
        <span className="text-lg leading-none">{isMoreActive ? MORE_TABS.find(t => t.id === active)?.icon : '⋯'}</span>
        <span className="leading-none">{isMoreActive ? MORE_TABS.find(t => t.id === active)?.label : 'More'}</span>
      </button>
    </nav>
  )
}
```

- [ ] **Step 4: Rewrite `src/App.tsx` with routing**

```tsx
import { useState } from 'react'
import { Header } from './components/layout/Header'
import { BottomNav, type TabId } from './components/layout/BottomNav'
import { CatalogPage }   from './pages/catalog/CatalogPage'
import { OrdersPage }    from './pages/orders/OrdersPage'
import { ProductsPage }  from './pages/products/ProductsPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { InvoicePage }   from './pages/invoice/InvoicePage'
import { ProfitsPage }   from './pages/profits/ProfitsPage'
import { ExpensesPage }  from './pages/expenses/ExpensesPage'
import { ReportsPage }   from './pages/reports/ReportsPage'
import { SettingsPage }  from './pages/settings/SettingsPage'

const PAGE_MAP: Record<TabId, React.ComponentType> = {
  catalog: CatalogPage,
  orders: OrdersPage,
  products: ProductsPage,
  inventory: InventoryPage,
  invoice: InvoicePage,
  profits: ProfitsPage,
  expenses: ExpensesPage,
  reports: ReportsPage,
  settings: SettingsPage,
}

export default function App() {
  const [tab, setTab] = useState<TabId>('catalog')
  const Page = PAGE_MAP[tab]

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <Header />
      <main className="flex-1 overflow-y-auto pb-20">
        <Page />
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
```

- [ ] **Step 5: Create stub pages so App.tsx compiles**

Create each of these with an identical stub — replace `CatalogPage` with the actual page name in each file:

`src/pages/catalog/CatalogPage.tsx`:
```tsx
export function CatalogPage() {
  return <div className="p-4 text-muted">Catalog — coming soon</div>
}
```

Repeat for: `OrdersPage`, `ProductsPage`, `InventoryPage`, `InvoicePage`, `ProfitsPage`, `ExpensesPage`, `ReportsPage`, `SettingsPage` — same pattern, adjust the label text.

- [ ] **Step 6: Verify dev server**

```bash
npm run dev
```

Expected: App loads with header (logo + "Checkout Hub"), bottom nav with 5+1 tabs, each tab shows its stub text.

- [ ] **Step 7: TypeScript check**

```bash
npx tsc -b --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: layout shell — Header, BottomNav, tab routing, stub pages"
```

---

## Task 4: Products Tab — CRUD + Multi-Photo Uploader

**Files:**
- Create: `src/components/shared/PhotoUploader.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Dialog.tsx`, `src/components/ui/Badge.tsx`
- Create: `src/pages/products/ProductsPage.tsx`, `src/pages/products/ProductListItem.tsx`, `src/pages/products/ProductForm.tsx`
- Create: `src/hooks/useProducts.ts`

- [ ] **Step 1: Write `src/components/ui/Button.tsx`**

```tsx
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold rounded-[var(--radius-md)] transition-colors cursor-pointer disabled:opacity-50',
        {
          'bg-accent text-white hover:bg-accent-hover': variant === 'primary',
          'bg-transparent text-muted hover:bg-surface2 hover:text-ink': variant === 'ghost',
          'bg-red-50 text-accent border border-accent/30 hover:bg-red-100': variant === 'danger',
          'bg-transparent border border-border text-ink hover:bg-surface2': variant === 'outline',
        },
        { 'text-xs px-3 py-1.5': size === 'sm', 'text-sm px-4 py-2': size === 'md', 'text-base px-5 py-2.5': size === 'lg' },
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Write `src/components/ui/Input.tsx`**

```tsx
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <input
        className={cn(
          'w-full bg-surface2 border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink outline-none transition-colors',
          'focus:border-accent focus:bg-surface',
          error && 'border-accent',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/ui/Badge.tsx`**

```tsx
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'green' | 'red' | 'gold' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
      {
        'bg-surface2 text-muted': variant === 'default',
        'bg-green-dim text-green': variant === 'green',
        'bg-accent-dim text-accent': variant === 'red',
        'bg-gold-dim text-gold': variant === 'gold',
        'bg-surface2 text-muted': variant === 'muted',
      },
      className,
    )}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Write `src/components/ui/Dialog.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'fixed inset-x-4 top-1/2 -translate-y-1/2 bg-surface rounded-2xl z-50 max-h-[90dvh] overflow-y-auto shadow-xl',
              className,
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-ink text-base">{title}</h2>
              <button onClick={onClose} className="text-muted text-xl leading-none hover:text-ink">×</button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 5: Write `src/components/shared/PhotoUploader.tsx`**

```tsx
import { useRef } from 'react'
import { Button } from '../ui/Button'

interface PhotoUploaderProps {
  photos: string[]              // base64 strings
  onChange: (photos: string[]) => void
  max?: number
}

export function PhotoUploader({ photos, onChange, max = 8 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const newPhotos: string[] = []
    for (const file of Array.from(files)) {
      if (photos.length + newPhotos.length >= max) break
      const base64 = await toBase64(file)
      newPhotos.push(base64)
    }
    onChange([...photos, ...newPhotos])
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
            >×</button>
          </div>
        ))}
        {photos.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted text-xs gap-1 hover:border-accent hover:text-accent transition-colors"
          >
            <span className="text-2xl">+</span>
            <span>Photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <p className="text-xs text-muted">{photos.length}/{max} photos</p>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/hooks/useProducts.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Product } from '../db'
import { todayISO } from '../lib/utils'

export function useProducts(category?: string) {
  return useLiveQuery(async () => {
    let q = db.products.orderBy('name')
    const all = await q.toArray()
    return category ? all.filter(p => p.category === category) : all
  }, [category])
}

export function useAvailableProducts() {
  return useLiveQuery(() =>
    db.products.filter(p => p.availableToday && p.stock > 0).toArray()
  )
}

export async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString()
  return db.products.add({ ...data, createdAt: now, updatedAt: now })
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>) {
  return db.products.update(id, { ...data, updatedAt: new Date().toISOString() })
}

export async function deleteProduct(id: number) {
  return db.products.delete(id)
}

export async function toggleAvailableToday(id: number, current: boolean) {
  return db.products.update(id, { availableToday: !current, updatedAt: new Date().toISOString() })
}
```

- [ ] **Step 7: Write `src/pages/products/ProductForm.tsx`**

```tsx
import { useState } from 'react'
import type { Product } from '../../db'
import { Dialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { PhotoUploader } from '../../components/shared/PhotoUploader'
import { addProduct, updateProduct } from '../../hooks/useProducts'

interface ProductFormProps {
  product?: Product
  open: boolean
  onClose: () => void
}

const EMPTY: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', description: '', category: '', costPrice: 0, sellPrice: 0,
  stock: 0, availableToday: true, photos: [],
}

export function ProductForm({ product, open, onClose }: ProductFormProps) {
  const [form, setForm] = useState(product ? {
    name: product.name, description: product.description, category: product.category,
    costPrice: product.costPrice, sellPrice: product.sellPrice, stock: product.stock,
    availableToday: product.availableToday, photos: product.photos, expiryDate: product.expiryDate,
  } : { ...EMPTY })

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (product?.id) {
      await updateProduct(product.id, form)
    } else {
      await addProduct(form)
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={product ? 'Edit Product' : 'Add Product'}>
      <div className="flex flex-col gap-3">
        <PhotoUploader photos={form.photos} onChange={p => set('photos', p)} />
        <Input label="Product Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Shampoo Rejoice 140ml" />
        <Input label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description or variant" />
        <Input label="Category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Personal Care" />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Cost Price ₱" type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice', Number(e.target.value))} />
          <Input label="Sell Price ₱" type="number" min="0" step="0.01" value={form.sellPrice} onChange={e => set('sellPrice', Number(e.target.value))} />
        </div>
        <Input label="Stock Qty" type="number" min="0" value={form.stock} onChange={e => set('stock', Number(e.target.value))} />
        <Input label="Expiry Date (optional)" type="date" value={form.expiryDate ?? ''} onChange={e => set('expiryDate', e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input type="checkbox" checked={form.availableToday} onChange={e => set('availableToday', e.target.checked)} className="accent-accent" />
          Available Today
        </label>
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleSave} disabled={!form.name.trim()}>Save Product</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 8: Write `src/pages/products/ProductListItem.tsx`**

```tsx
import type { Product } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
import { deleteProduct, toggleAvailableToday } from '../../hooks/useProducts'

interface ProductListItemProps {
  product: Product
  onEdit: () => void
}

export function ProductListItem({ product, onEdit }: ProductListItemProps) {
  const thumb = product.photos[0]

  return (
    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
      {thumb
        ? <img src={thumb} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
        : <div className="w-14 h-14 rounded-lg bg-surface2 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">{product.name}</p>
        <p className="text-xs text-muted truncate">{product.category}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-accent">{formatPHP(product.sellPrice)}</span>
          <span className="text-xs text-muted">cost {formatPHP(product.costPrice)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <Badge variant={product.stock === 0 ? 'red' : product.stock < 5 ? 'gold' : 'green'}>
          {product.stock === 0 ? 'Out' : `${product.stock} left`}
        </Badge>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <Button
            size="sm"
            variant={product.availableToday ? 'primary' : 'outline'}
            onClick={() => product.id && toggleAvailableToday(product.id, product.availableToday)}
          >
            {product.availableToday ? '✓ Today' : 'Add Today'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Write `src/pages/products/ProductsPage.tsx`**

```tsx
import { useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { ProductListItem } from './ProductListItem'
import { ProductForm } from './ProductForm'
import { Button } from '../../components/ui/Button'
import type { Product } from '../../db'

export function ProductsPage() {
  const products = useProducts()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-ink text-xl">Products</h1>
        <Button size="sm" onClick={() => setAdding(true)}>+ Add</Button>
      </div>

      {!products?.length && (
        <div className="text-center text-muted text-sm py-16">
          No products yet. Tap + Add to get started.
        </div>
      )}

      {products?.map(p => (
        <ProductListItem key={p.id} product={p} onEdit={() => setEditing(p)} />
      ))}

      <ProductForm open={adding} onClose={() => setAdding(false)} />
      {editing && (
        <ProductForm product={editing} open={!!editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 10: Verify in browser**

```bash
npm run dev
```

Open Products tab. Add a product with photos, verify it appears in the list. Toggle "Available Today". Edit and save changes.

- [ ] **Step 11: TypeScript check**

```bash
npx tsc -b --noEmit
```

Expected: 0 errors.

- [ ] **Step 12: Commit**

```bash
git add src/
git commit -m "feat: Products tab — CRUD, multi-photo uploader, available-today toggle"
```

---

## Task 5: Catalog Tab + Screenshot Mode

**Files:**
- Create: `src/components/shared/PhotoGallery.tsx`, `src/pages/catalog/CatalogCard.tsx`, `src/pages/catalog/ScreenshotMode.tsx`
- Modify: `src/pages/catalog/CatalogPage.tsx`

- [ ] **Step 1: Write `src/components/shared/PhotoGallery.tsx`**

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoGalleryProps {
  photos: string[]
  className?: string
  aspectRatio?: 'square' | 'video'
}

export function PhotoGallery({ photos, className = '', aspectRatio = 'square' }: PhotoGalleryProps) {
  const [idx, setIdx] = useState(0)

  if (!photos.length) {
    return (
      <div className={`bg-surface2 flex items-center justify-center text-4xl ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} ${className}`}>
        📦
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={photos[idx]}
          alt=""
          className="w-full h-full object-cover absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          drag={photos.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) setIdx(i => Math.min(i + 1, photos.length - 1))
            if (info.offset.x > 50) setIdx(i => Math.max(i - 1, 0))
          }}
        />
      </AnimatePresence>
      {photos.length > 1 && (
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/pages/catalog/CatalogCard.tsx`**

```tsx
import type { Product } from '../../db'
import { PhotoGallery } from '../../components/shared/PhotoGallery'
import { Badge } from '../../components/ui/Badge'
import { formatPHP } from '../../lib/utils'

interface CatalogCardProps {
  product: Product
  mode: 'edit' | 'screenshot'
}

export function CatalogCard({ product, mode }: CatalogCardProps) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-border shadow-sm">
      <PhotoGallery photos={product.photos} aspectRatio="square" />
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-ink text-sm leading-tight">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted leading-snug line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-accent text-base">{formatPHP(product.sellPrice)}</span>
          <Badge variant={product.availableToday && product.stock > 0 ? 'green' : 'red'}>
            {product.availableToday && product.stock > 0 ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `src/pages/catalog/ScreenshotMode.tsx`**

```tsx
import { useEffect } from 'react'
import type { Product } from '../../db'
import { CatalogCard } from './CatalogCard'
import { motion } from 'framer-motion'

interface ScreenshotModeProps {
  products: Product[]
  storeName: string
  onExit: () => void
}

export function ScreenshotMode({ products, storeName, onExit }: ScreenshotModeProps) {
  // Lock scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#FAFAF8] overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onExit}
    >
      {/* Clean header — no buttons, no chrome */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E5DF]">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-7 w-auto" />
          <span className="font-bold text-[#1A1917] text-base">{storeName}</span>
        </div>
        <span className="text-xs text-[#6B6760]">
          {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Product grid — full bleed, no padding waste */}
      <div className="grid grid-cols-2 gap-3 p-3">
        {products.map(p => (
          <CatalogCard key={p.id} product={p} mode="screenshot" />
        ))}
      </div>

      {/* Tap-to-exit hint — fades out after 2s */}
      <motion.div
        className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">Tap anywhere to exit</span>
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 4: Rewrite `src/pages/catalog/CatalogPage.tsx`**

```tsx
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { CatalogCard } from './CatalogCard'
import { ScreenshotMode } from './ScreenshotMode'
import { Button } from '../../components/ui/Button'
import { toggleAvailableToday } from '../../hooks/useProducts'

export function CatalogPage() {
  const [screenshotMode, setScreenshotMode] = useState(false)
  const allProducts = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const availableProducts = allProducts.filter(p => p.availableToday && p.stock > 0)

  return (
    <>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-ink text-xl">Today's Catalog</h1>
            <p className="text-xs text-muted">{availableProducts.length} items available</p>
          </div>
          <Button onClick={() => setScreenshotMode(true)} disabled={availableProducts.length === 0}>
            📸 Share View
          </Button>
        </div>

        {allProducts.length === 0 && (
          <div className="text-center text-muted text-sm py-16">
            No products yet. Go to Products tab to add items.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {allProducts.map(p => (
            <div key={p.id} className="flex flex-col gap-1.5">
              <CatalogCard product={p} mode="edit" />
              <button
                onClick={() => p.id && toggleAvailableToday(p.id, p.availableToday)}
                className={`text-xs font-semibold rounded-lg py-1.5 transition-colors ${
                  p.availableToday
                    ? 'bg-green-dim text-green'
                    : 'bg-surface2 text-muted hover:bg-accent-dim hover:text-accent'
                }`}
              >
                {p.availableToday ? '✓ Available Today' : '+ Set Available'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {screenshotMode && (
          <ScreenshotMode
            products={availableProducts}
            storeName="Checkout Hub"
            onExit={() => setScreenshotMode(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

1. Add 2-3 products in Products tab with photos and toggle "Available Today"
2. Go to Catalog tab — verify 2-col grid shows products with photo galleries
3. Tap "📸 Share View" — verify all chrome disappears, full-screen product board shows
4. Tap anywhere — verify it exits back to Edit mode

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: Catalog tab — photo gallery, available-today toggle, Screenshot Mode"
```

---

## Task 6: Orders Tab — Quick-Add + List

**Files:**
- Create: `src/hooks/useOrders.ts`, `src/pages/orders/QuickAddOrder.tsx`, `src/pages/orders/OrderCard.tsx`
- Modify: `src/pages/orders/OrdersPage.tsx`

- [ ] **Step 1: Write `src/hooks/useOrders.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Order, type OrderItem } from '../db'
import { genOrderRef, todayISO } from '../lib/utils'

export function useOrders() {
  return useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray())
}

export async function addOrder(customerName: string, items: OrderItem[], notes = ''): Promise<void> {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const cost = 0  // profit calculated separately via product cost lookup
  await db.orders.add({
    ref: genOrderRef(),
    customerName,
    items,
    total,
    status: 'pending',
    notes,
    createdAt: new Date().toISOString(),
  })
}

export async function updateOrderStatus(id: number, status: Order['status']): Promise<void> {
  await db.orders.update(id, { status })
}

export async function deleteOrder(id: number): Promise<void> {
  await db.orders.delete(id)
}
```

- [ ] **Step 2: Write `src/pages/orders/QuickAddOrder.tsx`**

```tsx
import { useState } from 'react'
import { Sheet } from '../../components/layout/../../../components/ui/../../../components/ui/Sheet'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type OrderItem } from '../../db'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { addOrder } from '../../hooks/useOrders'
import { formatPHP } from '../../lib/utils'

interface QuickAddOrderProps {
  open: boolean
  onClose: () => void
}

export function QuickAddOrder({ open, onClose }: QuickAddOrderProps) {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState('')

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  function toggleProduct(productId: number, name: string, price: number) {
    setItems(prev => {
      const exists = prev.find(i => i.productId === productId)
      if (exists) return prev.filter(i => i.productId !== productId)
      return [...prev, { productId, name, qty: 1, price }]
    })
  }

  function setQty(productId: number, qty: number) {
    if (qty < 1) return
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
  }

  async function handleSave() {
    if (!customerName.trim() || !items.length) return
    await addOrder(customerName.trim(), items, notes)
    setCustomerName('')
    setItems([])
    setNotes('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} className="pb-8">
      <div className="px-4 flex flex-col gap-4">
        <h2 className="font-bold text-ink text-lg">New Order</h2>
        <Input
          label="Customer Name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="e.g. Maria Santos"
          autoFocus
        />

        <div>
          <p className="text-xs font-medium text-muted mb-2">Items (tap to add)</p>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
            {products.map(p => {
              const item = items.find(i => i.productId === p.id!)
              return (
                <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${item ? 'border-accent bg-accent-dim' : 'border-border'}`}>
                  <button className="flex-1 text-left" onClick={() => toggleProduct(p.id!, p.name, p.sellPrice)}>
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{formatPHP(p.sellPrice)}</p>
                  </button>
                  {item && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setQty(p.id!, item.qty - 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center text-sm">−</button>
                      <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => setQty(p.id!, item.qty + 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center text-sm">+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, etc." />

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-bold text-ink">Total: <span className="text-accent">{formatPHP(total)}</span></span>
          <Button onClick={handleSave} disabled={!customerName.trim() || !items.length}>Save Order</Button>
        </div>
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 3: Write `src/pages/orders/OrderCard.tsx`**

```tsx
import type { Order } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatPHP, formatDate } from '../../lib/utils'
import { updateOrderStatus, deleteOrder } from '../../hooks/useOrders'

const STATUS_VARIANT: Record<Order['status'], 'muted' | 'gold' | 'green'> = {
  pending: 'gold', paid: 'green', done: 'muted',
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink text-sm">{order.customerName}</p>
          <p className="text-xs text-muted">{order.ref} · {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
      </div>

      <div className="text-xs text-muted space-y-0.5">
        {order.items.map((item, i) => (
          <p key={i}>{item.name} × {item.qty} = {formatPHP(item.price * item.qty)}</p>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="font-bold text-accent">{formatPHP(order.total)}</span>
        <div className="flex gap-1">
          {order.status === 'pending' && (
            <Button size="sm" onClick={() => order.id && updateOrderStatus(order.id, 'paid')}>Mark Paid</Button>
          )}
          {order.status === 'paid' && (
            <Button size="sm" variant="outline" onClick={() => order.id && updateOrderStatus(order.id, 'done')}>Mark Done</Button>
          )}
          <Button size="sm" variant="danger" onClick={() => order.id && deleteOrder(order.id)}>Del</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `src/pages/orders/OrdersPage.tsx`**

```tsx
import { useState } from 'react'
import { useOrders } from '../../hooks/useOrders'
import { OrderCard } from './OrderCard'
import { QuickAddOrder } from './QuickAddOrder'
import { Button } from '../../components/ui/Button'

export function OrdersPage() {
  const orders = useOrders()
  const [adding, setAdding] = useState(false)

  const pending = orders?.filter(o => o.status === 'pending') ?? []
  const rest = orders?.filter(o => o.status !== 'pending') ?? []

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-ink text-xl">Orders</h1>
        <Button size="sm" onClick={() => setAdding(true)}>+ New Order</Button>
      </div>

      {!orders?.length && (
        <div className="text-center text-muted text-sm py-16">No orders yet.</div>
      )}

      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Pending ({pending.length})</p>
          {pending.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      )}

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">History</p>
          {rest.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      )}

      <QuickAddOrder open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
```

- [ ] **Step 5: Fix the broken import in QuickAddOrder**

The `Sheet` import path in QuickAddOrder is malformed. Replace the import at the top of `src/pages/orders/QuickAddOrder.tsx`:

```tsx
import { Sheet } from '../../components/ui/Sheet'
```

(Remove the nested incorrect path — use the simple relative import above.)

- [ ] **Step 6: Verify in browser — add an order end-to-end**

```bash
npm run dev
```

1. Orders tab → New Order
2. Type customer name, tap 2 products, adjust qty
3. Save → order appears in Pending list
4. Mark Paid → badge turns green
5. Mark Done → moves to History

- [ ] **Step 7: TypeScript check + commit**

```bash
npx tsc -b --noEmit
git add src/
git commit -m "feat: Orders tab — quick-add form, order list, status flow"
```

---

## Task 7: Inventory Tab

**Files:**
- Modify: `src/pages/inventory/InventoryPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/inventory/InventoryPage.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { formatPHP, todayISO } from '../../lib/utils'
import { updateProduct, toggleAvailableToday } from '../../hooks/useProducts'
import { useState } from 'react'

export function InventoryPage() {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const [restocking, setRestocking] = useState<number | null>(null)
  const [restockQty, setRestockQty] = useState('')

  const lowStock = products.filter(p => p.stock > 0 && p.stock < 5)
  const outOfStock = products.filter(p => p.stock === 0)
  const expiringSoon = products.filter(p => {
    if (!p.expiryDate) return false
    const diff = (new Date(p.expiryDate).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 7
  })

  async function handleRestock(id: number) {
    const qty = parseInt(restockQty)
    if (!qty || qty < 1) return
    const product = products.find(p => p.id === id)
    if (!product) return
    await updateProduct(id, { stock: product.stock + qty })
    setRestocking(null)
    setRestockQty('')
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="font-bold text-ink text-xl">Inventory</h1>

      {/* Alert summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-accent-dim rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-accent">{outOfStock.length}</p>
          <p className="text-xs text-muted mt-0.5">Out of Stock</p>
        </div>
        <div className="bg-gold-dim rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gold">{lowStock.length}</p>
          <p className="text-xs text-muted mt-0.5">Low Stock</p>
        </div>
        <div className="bg-surface2 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-ink">{expiringSoon.length}</p>
          <p className="text-xs text-muted mt-0.5">Expiring Soon</p>
        </div>
      </div>

      {/* Full inventory list */}
      <div className="flex flex-col gap-2">
        {products.map(p => (
          <div key={p.id} className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-sm truncate">{p.name}</p>
              <p className="text-xs text-muted">{p.category}</p>
              {p.expiryDate && (
                <p className="text-xs text-gold mt-0.5">Exp: {p.expiryDate}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={p.stock === 0 ? 'red' : p.stock < 5 ? 'gold' : 'green'}>
                {p.stock} left
              </Badge>
              <button
                onClick={() => p.id && toggleAvailableToday(p.id, p.availableToday)}
                className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                  p.availableToday ? 'bg-green-dim text-green' : 'bg-surface2 text-muted'
                }`}
              >
                {p.availableToday ? '✓ Today' : 'Off'}
              </button>
              {restocking === p.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={e => setRestockQty(e.target.value)}
                    className="w-14 text-sm border border-border rounded px-2 py-1 bg-surface2"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleRestock(p.id!)}
                  />
                  <button onClick={() => handleRestock(p.id!)} className="text-xs bg-accent text-white px-2 py-1 rounded font-semibold">+</button>
                  <button onClick={() => setRestocking(null)} className="text-xs text-muted">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => { setRestocking(p.id ?? null); setRestockQty('') }}
                  className="text-xs text-muted hover:text-accent px-1"
                >Restock</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify + commit**

```bash
npm run dev
# Open Inventory tab — check summary cards and restock flow
npx tsc -b --noEmit
git add src/pages/inventory/
git commit -m "feat: Inventory tab — stock levels, expiry alerts, restock, available-today"
```

---

## Task 8: Invoice Builder + Print

**Files:**
- Create: `src/hooks/useInvoices.ts`, `src/pages/invoice/InvoicePrint.tsx`
- Modify: `src/pages/invoice/InvoicePage.tsx`

- [ ] **Step 1: Write `src/hooks/useInvoices.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Invoice, type InvoiceItem } from '../db'
import { genInvoiceNo } from '../lib/utils'

export function useInvoices() {
  return useLiveQuery(() => db.invoices.orderBy('createdAt').reverse().toArray())
}

export async function addInvoice(data: Omit<Invoice, 'id' | 'invoiceNo' | 'createdAt'>, prefix = 'INV'): Promise<void> {
  await db.invoices.add({
    ...data,
    invoiceNo: genInvoiceNo(prefix),
    createdAt: new Date().toISOString(),
  })
}
```

- [ ] **Step 2: Write `src/pages/invoice/InvoicePrint.tsx`**

```tsx
import type { Invoice } from '../../db'
import { formatPHP, formatDate } from '../../lib/utils'

interface InvoicePrintProps {
  invoice: Invoice
  storeName: string
  storePhone: string
  storeAddress: string
}

export function printInvoice({ invoice, storeName, storePhone, storeAddress }: InvoicePrintProps) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; max-width: 400px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #E01C24; padding-bottom: 12px; }
    .store-name { font-size: 20px; font-weight: bold; color: #1A1917; }
    .inv-no { color: #E01C24; font-weight: bold; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { text-align: left; font-size: 11px; color: #6B6760; padding: 4px 0; border-bottom: 1px solid #E8E5DF; }
    td { padding: 5px 0; border-bottom: 1px solid #F5F4F0; font-size: 12px; }
    .total-row { font-weight: bold; font-size: 14px; color: #E01C24; }
    .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #6B6760; }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    <div>${storePhone} · ${storeAddress}</div>
    <div class="inv-no">${invoice.invoiceNo}</div>
    <div>${formatDate(invoice.createdAt)}</div>
  </div>
  <div><strong>Customer:</strong> ${invoice.customerName}</div>
  <table>
    <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
    ${invoice.items.map(i => `<tr>
      <td>${i.description}</td>
      <td>${i.qty}</td>
      <td>${formatPHP(i.price)}</td>
      <td>${formatPHP(i.price * i.qty)}</td>
    </tr>`).join('')}
    <tr class="total-row">
      <td colspan="3">Total</td>
      <td>${formatPHP(invoice.total)}</td>
    </tr>
  </table>
  ${invoice.paidVia ? `<div><strong>Paid via:</strong> ${invoice.paidVia}</div>` : ''}
  ${invoice.notes ? `<div class="footer">${invoice.notes}</div>` : ''}
  <div class="footer">Thank you!</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.print()
}
```

- [ ] **Step 3: Rewrite `src/pages/invoice/InvoicePage.tsx`**

```tsx
import { useState } from 'react'
import type { InvoiceItem } from '../../db'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { addInvoice } from '../../hooks/useInvoices'
import { printInvoice } from './InvoicePrint'
import { formatPHP } from '../../lib/utils'

const EMPTY_ITEM: InvoiceItem = { description: '', qty: 1, price: 0 }

export function InvoicePage() {
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }])
  const [discount, setDiscount] = useState(0)
  const [paidVia, setPaidVia] = useState('')
  const [notes, setNotes] = useState('')

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const total = Math.max(0, subtotal - discount)

  function setItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!customerName.trim() || !items.some(i => i.description.trim())) return
    const invoice = {
      customerName: customerName.trim(),
      items: items.filter(i => i.description.trim()),
      subtotal,
      discount,
      total,
      paidVia,
      notes,
    }
    await addInvoice(invoice)
    printInvoice({ invoice: { ...invoice, id: 0, invoiceNo: 'INV-PREVIEW', createdAt: new Date().toISOString() }, storeName: 'Checkout Hub', storePhone: '', storeAddress: '' })
    setCustomerName(''); setItems([{ ...EMPTY_ITEM }]); setDiscount(0); setPaidVia(''); setNotes('')
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="font-bold text-ink text-xl">Invoice</h1>
      <Input label="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" />

      <div>
        <p className="text-xs font-medium text-muted mb-2">Line Items</p>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_56px_72px_32px] gap-1.5 mb-1.5 items-end">
            <Input placeholder="Description" value={item.description} onChange={e => setItem(idx, 'description', e.target.value)} />
            <Input type="number" min="1" placeholder="Qty" value={item.qty} onChange={e => setItem(idx, 'qty', Number(e.target.value))} />
            <Input type="number" min="0" placeholder="Price" value={item.price} onChange={e => setItem(idx, 'price', Number(e.target.value))} />
            <button onClick={() => removeItem(idx)} className="h-9 flex items-center justify-center text-muted hover:text-accent">×</button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={addItem}>+ Add Line</Button>
      </div>

      <div className="bg-surface2 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{formatPHP(subtotal)}</span></div>
        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted">Discount</span>
          <input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))}
            className="w-24 text-right bg-transparent border-b border-border text-sm outline-none" />
        </div>
        <div className="flex justify-between font-bold text-base border-t border-border pt-2">
          <span>Total</span><span className="text-accent">{formatPHP(total)}</span>
        </div>
      </div>

      <Input label="Paid Via" value={paidVia} onChange={e => setPaidVia(e.target.value)} placeholder="GCash, Cash, etc." />
      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional footer note" />

      <Button size="lg" className="w-full" onClick={handleSave} disabled={!customerName.trim()}>
        Save & Print Invoice
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Verify + commit**

```bash
npm run dev
# Invoice tab: fill form, Save & Print → browser print dialog opens
npx tsc -b --noEmit
git add src/
git commit -m "feat: Invoice builder + print/PDF"
```

---

## Task 9: Profits + Expenses

**Files:**
- Create: `src/hooks/useProfits.ts`, `src/hooks/useExpenses.ts`
- Modify: `src/pages/profits/ProfitsPage.tsx`, `src/pages/expenses/ExpensesPage.tsx`

- [ ] **Step 1: Write `src/hooks/useProfits.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function useProfits(filter: 'today' | 'week' | 'month' | 'all' = 'all') {
  return useLiveQuery(async () => {
    const all = await db.profits.orderBy('date').reverse().toArray()
    const now = new Date()
    if (filter === 'today') {
      const today = now.toISOString().slice(0, 10)
      return all.filter(p => p.date === today)
    }
    if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
      return all.filter(p => p.date >= weekAgo)
    }
    if (filter === 'month') {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      return all.filter(p => p.date >= monthStart)
    }
    return all
  }, [filter])
}
```

- [ ] **Step 2: Write `src/hooks/useExpenses.ts`**

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Expense } from '../db'
import { todayISO } from '../lib/utils'

export function useExpenses() {
  return useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray())
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<void> {
  await db.expenses.add(data)
}

export async function deleteExpense(id: number): Promise<void> {
  await db.expenses.delete(id)
}
```

- [ ] **Step 3: Rewrite `src/pages/profits/ProfitsPage.tsx`**

```tsx
import { useState } from 'react'
import { useProfits } from '../../hooks/useProfits'
import { formatPHP, formatDateShort } from '../../lib/utils'
import { Badge } from '../../components/ui/Badge'

type Filter = 'today' | 'week' | 'month' | 'all'

export function ProfitsPage() {
  const [filter, setFilter] = useState<Filter>('month')
  const profits = useProfits(filter) ?? []

  const totalRevenue = profits.reduce((s, p) => s + p.revenue, 0)
  const totalCost = profits.reduce((s, p) => s + p.cost, 0)
  const totalProfit = profits.reduce((s, p) => s + p.profit, 0)
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'today', label: 'Today' }, { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' }, { id: 'all', label: 'All' },
  ]

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="font-bold text-ink text-xl">Profits</h1>

      <div className="flex gap-1.5">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${filter === f.id ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface rounded-xl border border-border p-3"><p className="text-xs text-muted">Revenue</p><p className="text-xl font-bold text-ink mt-0.5">{formatPHP(totalRevenue)}</p></div>
        <div className="bg-surface rounded-xl border border-border p-3"><p className="text-xs text-muted">Profit</p><p className="text-xl font-bold text-green mt-0.5">{formatPHP(totalProfit)}</p></div>
        <div className="bg-surface rounded-xl border border-border p-3"><p className="text-xs text-muted">Cost</p><p className="text-xl font-bold text-muted mt-0.5">{formatPHP(totalCost)}</p></div>
        <div className="bg-surface rounded-xl border border-border p-3"><p className="text-xs text-muted">Margin</p><p className="text-xl font-bold text-gold mt-0.5">{margin}%</p></div>
      </div>

      <div className="flex flex-col gap-2">
        {!profits.length && <p className="text-center text-muted text-sm py-8">No profit entries for this period.</p>}
        {profits.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-surface rounded-xl border border-border px-3 py-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant={p.source === 'order' ? 'green' : p.source === 'invoice' ? 'gold' : 'muted'}>{p.source}</Badge>
                <span className="text-xs text-muted">{p.ref}</span>
              </div>
              <p className="text-xs text-muted mt-0.5">{formatDateShort(p.date)}</p>
            </div>
            <span className="font-bold text-green">{formatPHP(p.profit)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `src/pages/expenses/ExpensesPage.tsx`**

```tsx
import { useState } from 'react'
import { useExpenses, addExpense, deleteExpense } from '../../hooks/useExpenses'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatPHP, todayISO } from '../../lib/utils'

export function ExpensesPage() {
  const expenses = useExpenses() ?? []
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayISO())

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  async function handleAdd() {
    if (!desc.trim() || !amount) return
    await addExpense({ description: desc.trim(), amount: Number(amount), category, date })
    setDesc(''); setAmount(''); setCategory('')
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="font-bold text-ink text-xl">Expenses</h1>

      {/* Add form */}
      <div className="bg-surface rounded-xl border border-border p-3 flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted">Add Expense</p>
        <Input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="Amount ₱" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Button onClick={handleAdd} disabled={!desc.trim() || !amount}>Add Expense</Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Total</p>
        <p className="font-bold text-accent">{formatPHP(total)}</p>
      </div>

      <div className="flex flex-col gap-2">
        {expenses.map(e => (
          <div key={e.id} className="flex items-center justify-between bg-surface rounded-xl border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-ink">{e.description}</p>
              <p className="text-xs text-muted">{e.category ? `${e.category} · ` : ''}{e.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">{formatPHP(e.amount)}</span>
              <button onClick={() => e.id && deleteExpense(e.id)} className="text-muted hover:text-accent text-lg leading-none">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify + commit**

```bash
npm run dev
npx tsc -b --noEmit
git add src/
git commit -m "feat: Profits and Expenses tabs"
```

---

## Task 10: Reports + CSV Export

**Files:**
- Modify: `src/pages/reports/ReportsPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/reports/ReportsPage.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
import { ordersToCSV, profitsToCSV, expensesToCSV, downloadCSV } from '../../lib/csv'

export function ReportsPage() {
  const orders   = useLiveQuery(() => db.orders.toArray()) ?? []
  const profits  = useLiveQuery(() => db.profits.toArray()) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray()) ?? []

  const totalRevenue = profits.reduce((s, p) => s + p.revenue, 0)
  const totalProfit  = profits.reduce((s, p) => s + p.profit, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = totalProfit - totalExpenses

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="font-bold text-ink text-xl">Reports</h1>

      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">All-Time Summary</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><p className="text-muted text-xs">Total Orders</p><p className="font-bold">{orders.length}</p></div>
          <div><p className="text-muted text-xs">Revenue</p><p className="font-bold text-ink">{formatPHP(totalRevenue)}</p></div>
          <div><p className="text-muted text-xs">Gross Profit</p><p className="font-bold text-green">{formatPHP(totalProfit)}</p></div>
          <div><p className="text-muted text-xs">Expenses</p><p className="font-bold text-accent">{formatPHP(totalExpenses)}</p></div>
        </div>
        <div className="border-t border-border pt-2 flex justify-between font-bold">
          <span>Net Profit</span>
          <span className={netProfit >= 0 ? 'text-green' : 'text-accent'}>{formatPHP(netProfit)}</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Export CSV</p>
        <Button variant="outline" className="w-full justify-start"
          onClick={() => downloadCSV('orders.csv', ordersToCSV(orders))}>
          📋 Export Orders ({orders.length})
        </Button>
        <Button variant="outline" className="w-full justify-start"
          onClick={() => downloadCSV('profits.csv', profitsToCSV(profits))}>
          💰 Export Profits ({profits.length})
        </Button>
        <Button variant="outline" className="w-full justify-start"
          onClick={() => downloadCSV('expenses.csv', expensesToCSV(expenses))}>
          💸 Export Expenses ({expenses.length})
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify + commit**

```bash
npm run dev
# Reports tab: check summary numbers, test CSV download buttons
npx tsc -b --noEmit
git add src/pages/reports/
git commit -m "feat: Reports tab — summary, CSV export"
```

---

## Task 11: Settings + Backup/Restore

**Files:**
- Modify: `src/pages/settings/SettingsPage.tsx`, `src/App.tsx`

- [ ] **Step 1: Rewrite `src/pages/settings/SettingsPage.tsx`**

```tsx
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
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(file)
      alert('Backup restored successfully. Reload to see changes.')
      window.location.reload()
    } catch {
      alert('Failed to restore backup. Please check the file.')
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="font-bold text-ink text-xl">Settings</h1>

      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Store Info</p>
        <Input label="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} />
        <Input label="Invoice Prefix" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV" />
        <Button onClick={handleSave}>{saved ? '✓ Saved!' : 'Save Settings'}</Button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Data Backup</p>
        <p className="text-xs text-muted">Export a JSON backup of all your data. Restore it anytime to recover your store.</p>
        <Button variant="outline" className="w-full" onClick={exportBackup}>⬇ Export Backup</Button>
        <Button variant="ghost" className="w-full" onClick={() => importRef.current?.click()}>⬆ Restore Backup</Button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">About</p>
        <p className="text-xs text-muted">Checkout Hub PH v2.0 · Local-first PWA · Data stays on your device</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire store name into App.tsx Header**

Modify `src/App.tsx` to load the store name setting and pass it to Header:

```tsx
// Add at top of App.tsx
import { useEffect, useState } from 'react'
import { getSetting } from './db'

// Inside App():
const [storeName, setStoreName] = useState('Checkout Hub')
useEffect(() => { getSetting('store_name', 'Checkout Hub').then(setStoreName) }, [])

// In JSX:
<Header storeName={storeName} />
```

- [ ] **Step 3: Verify + commit**

```bash
npm run dev
# Settings: change store name → save → check Header updates
# Export backup → import it back → reload and verify data intact
npx tsc -b --noEmit
git add src/
git commit -m "feat: Settings, backup/restore, store name wired to header"
```

---

## Task 12: PWA Icons + Polish Pass

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png`
- Modify: `src/App.tsx`, `src/components/layout/BottomNav.tsx`, global CSS

- [ ] **Step 1: Generate PWA icons from the logo**

```bash
cd /e/SaaS/CHECKOUTHUBPH
node -e "
const fs = require('fs');
const buf = fs.readFileSync('public/logo.png');
// Copy logo.png as icon-192 and icon-512 (browser scales as needed)
fs.copyFileSync('public/logo.png', 'public/icon-192.png');
fs.copyFileSync('public/logo.png', 'public/icon-512.png');
console.log('Icons copied');
"
```

- [ ] **Step 2: Add `safe-b` utility to CSS for iPhone home indicator**

Append to `src/index.css`:
```css
@layer utilities {
  .safe-b { padding-bottom: env(safe-area-inset-bottom, 0px); }
}
```

- [ ] **Step 3: Add `inter` font via Google Fonts in `index.html`**

Add inside `<head>` of `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

- [ ] **Step 4: Add `EmptyState` shared component**

Create `src/components/shared/EmptyState.tsx`:
```tsx
export function EmptyState({ emoji = '📦', message }: { emoji?: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm text-muted">{message}</p>
    </div>
  )
}
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: build succeeds with no errors, `dist/` produced.

- [ ] **Step 6: TypeScript final check**

```bash
npx tsc -b --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit everything**

```bash
git add src/ public/ index.html
git commit -m "feat: PWA icons, Inter font, safe-area, EmptyState — polish pass"
```

---

## Task 13: Deploy to Vercel

- [ ] **Step 1: Merge to main**

```bash
git checkout main
git merge feat/vite-rebuild --no-ff -m "feat: full Vite + React reconstruction of Checkout Hub PH v2.0"
```

- [ ] **Step 2: Push to trigger auto-deploy**

```bash
git push origin main
```

Expected: Vercel auto-deploys. Check Vercel dashboard for build log.

- [ ] **Step 3: Smoke test live at checkout-hub-ph.vercel.app**

Check each of these manually:
- [ ] Page loads with Logo + store name in header
- [ ] Bottom nav tabs all switch correctly
- [ ] Products tab: add product with 2 photos, verify it appears
- [ ] Catalog tab: toggle product available, tap "📸 Share View", verify Screenshot Mode launches and exits
- [ ] Orders tab: add order with 2 items, verify total, mark paid
- [ ] Inventory tab: restock a product
- [ ] Settings: change store name, save, verify header updates
- [ ] Settings: export backup JSON, import it back
- [ ] PWA: Chrome → three-dot menu → "Install app" — verify it installs

- [ ] **Step 4: Final commit — update memory**

```bash
git tag v2.0.0
git push origin main --tags
```

---

## Self-Review — Spec Coverage Check

| Requirement | Task |
|---|---|
| Light Retail Console design (warm bg, red accent, roomy) | T1 (CSS tokens), T3 (layout) |
| Logo retained from v6 | T1 (extracted to public/logo.png) |
| Vite + React + TS + Tailwind v4 | T1 |
| Dexie.js IndexedDB | T2 |
| Offline-first PWA | T1 (vite-plugin-pwa), T12 (icons) |
| Products CRUD + 1-8 photos | T4 |
| Catalog: 2-col photo grid | T5 |
| Catalog: Available Today toggle | T4, T5, T7 |
| Catalog: Screenshot Mode (chrome-free) | T5 |
| Orders: quick-add 10-second form | T6 |
| Orders: status flow (pending→paid→done) | T6 |
| Inventory: stock levels + alerts | T7 |
| Inventory: restock | T7 |
| Invoice builder + print | T8 |
| Profits log | T9 |
| Expenses tracker | T9 |
| Reports summary + CSV export | T10 |
| Settings + backup/restore | T11 |
| Store name wired to header | T11 |
| Vercel deploy same URL | T13 |
| Tests for DB + utils + CSV | T2 |

All 20 requirements covered. No placeholders found.
