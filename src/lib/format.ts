import { format, isThisMonth, isThisYear, isToday, isYesterday, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const currencyFormatterSigned = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  signDisplay: 'always',
})

export function formatCurrency(amount: number, { signed = false }: { signed?: boolean } = {}) {
  return (signed ? currencyFormatterSigned : currencyFormatter).format(amount)
}

export function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatPercent(value: number, digits = 0) {
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatDateLabel(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return 'Oggi'
  if (isYesterday(date)) return 'Ieri'
  if (isThisYear(date)) return format(date, 'EEEE d MMMM', { locale: it })
  return format(date, 'EEEE d MMMM yyyy', { locale: it })
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy')
}

export function formatMonthLabel(iso: string): string {
  const date = parseISO(iso)
  const label = format(date, 'MMMM yyyy', { locale: it })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export { isThisMonth }
