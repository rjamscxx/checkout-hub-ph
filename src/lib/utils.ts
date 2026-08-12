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
