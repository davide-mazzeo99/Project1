import Papa from 'papaparse'
import type { Account, Category, Transaction } from '@/types'

export function exportTransactionsCsv(
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  accountById: Map<string, Account>,
): void {
  const rows = transactions.map((t) => ({
    Data: t.date,
    Importo: t.amount.toFixed(2).replace('.', ','),
    Descrizione: t.description,
    Categoria: t.categoryId ? categoryById.get(t.categoryId)?.name ?? '' : '',
    Conto: accountById.get(t.accountId)?.name ?? '',
    Trasferimento: t.isTransfer ? 'si' : 'no',
    Ricorrente: t.isRecurring ? 'si' : 'no',
    Note: t.notes ?? '',
  }))

  const csv = Papa.unparse(rows, { delimiter: ';' })
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `transazioni-${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
