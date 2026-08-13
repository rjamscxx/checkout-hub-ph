# Checkout Hub PH — Full Reconstruction Design
**Date:** 2026-08-12  
**Status:** Approved, building

---

## Context

Checkout Hub PH is RJ's personal business operating system for a general merchandise online store (orders via Messenger/Facebook). Previously a 460KB single-file vanilla HTML/JS app. This reconstruction modernizes the stack while preserving the core philosophy: offline-first, owner owns data, fast on cheap phones.

---

## Design Direction

**Visual:** Light Retail Console  
- Warm paper white background (`#FAFAF8`)
- Red punch accent (`#E01C24`) — retained from v6
- Roomy cards, 16px base type, big tap targets
- Photo-first product cards

**Logo:** Retained from v6 (base64 PNG, extracted and placed in `public/`)

---

## Architecture

**Stack:**
- Vite + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui (Button, Sheet, Dialog, Badge, Tabs)
- Dexie.js (IndexedDB — products, orders, invoices, profits, expenses)
- Photos stored as base64 in IndexedDB (1–8 per product)
- `vite-plugin-pwa` — installable, fully offline
- Framer Motion (photo gallery swipe, transitions)
- Vercel (auto-deploy on git push, same URL)

**Data stays local.** No server, no auth, no backend required. Supabase cloud sync is a future optional layer.

---

## Dexie Schema

```ts
// products
{ id, name, description, category, costPrice, sellPrice, stock, availableToday, photos: string[], expiryDate?, createdAt, updatedAt }

// orders
{ id, ref, customerName, items: [{productId, name, qty, price}], total, status, notes, createdAt }

// invoices
{ id, invoiceNo, customerName, items, subtotal, discount, total, paidVia, createdAt }

// profits
{ id, source: 'order'|'invoice'|'manual', ref, revenue, cost, profit, date }

// expenses
{ id, description, amount, category, date }
```

---

## Modules (9 tabs)

### 1. 📸 Catalog ← THE CORE
Two modes:

**Edit Mode (internal):**
- 2-col product grid, big photos, name, price, stock badge
- "Available Today" toggle per product
- Photo gallery swiper (1–8 photos per product, Framer Motion)
- ＋ Add product button

**Screenshot Mode (share to customers):**
- Tap "📸 Share View" → all app chrome disappears
- Full-bleed clean product board: logo top-left, date top-right
- 2-col cards: full-width photo, name, price, availability badge
- Tap anywhere to exit back to Edit Mode

### 2. 📋 Orders
- Quick-add form: customer name → pick items from catalog → auto-total → save (10 seconds)
- Order list with status (Pending → Paid → Done)
- Mark paid, mark done, delete

### 3. 📦 Products
- CRUD with multi-photo uploader (1–8 photos, tap to reorder/remove)
- Fields: name, description, category, cost price, sell price, stock, expiry (optional)
- Category filter chips

### 4. 📊 Inventory
- Stock levels per product
- Low-stock alerts (configurable threshold)
- Expiry alerts
- Quick restock input
- "Available Today" column (links to Catalog)

### 5. 🧾 Invoice
- Manual invoice builder (line items from catalog or freeform)
- Live preview panel
- Print/PDF export (clean A4)
- Deductions/discount support

### 6. 💰 Profits
- Unified log: shop orders + invoices + manual entries
- Source badges (Order / Invoice / Manual)
- Today / This week / This month filters
- Cost vs revenue vs margin

### 7. 💸 Expenses
- Add expense: description, amount, category, date
- Expense list with totals by period

### 8. 📈 Reports
- Period summaries (daily/weekly/monthly)
- CSV export (orders, profits, expenses, inventory)

### 9. ⚙️ Settings
- Store name, tagline
- Payment methods (up to 5 slots with QR upload)
- Invoice prefix
- Backup (JSON export) / Restore (JSON import)
- Reset data

---

## Navigation

**Mobile:** Bottom tab bar (5 visible tabs + "More" sheet for the rest)  
**Desktop:** Left sidebar or top tab strip  
**Logo:** Top-left in header at all times (except Screenshot Mode)

---

## Build Order

1. Project scaffold (Vite + React + TS + Tailwind + shadcn + Dexie + PWA)
2. Dexie schema + db singleton + seed data
3. Products tab (CRUD + multi-photo)
4. Catalog tab + Screenshot Mode
5. Orders quick-add + list
6. Inventory tab
7. Invoice builder + print
8. Profits log
9. Expenses tracker
10. Reports + CSV export
11. Settings + backup/restore
12. Polish pass: motion, light retail palette, logo, PWA manifest
13. Vercel deploy + smoke test
