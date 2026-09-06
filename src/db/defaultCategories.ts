import type { Category } from '@/types'

/**
 * Default category set (id is stable/human-readable so rules & seed data
 * can reference it without a DB round-trip).
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-affitto', name: 'Affitto', type: 'expense', color: '#ef4444', icon: 'home', isFixed: true, isDefault: true },
  { id: 'cat-spesa', name: 'Spesa alimentare', type: 'expense', color: '#f97316', icon: 'shopping-cart', isFixed: false, isDefault: true },
  { id: 'cat-ristoranti', name: 'Ristoranti/Bar', type: 'expense', color: '#f59e0b', icon: 'utensils', isFixed: false, isDefault: true },
  { id: 'cat-trasporti', name: 'Trasporti', type: 'expense', color: '#eab308', icon: 'bus', isFixed: false, isDefault: true },
  { id: 'cat-bollette', name: 'Bollette/Utenze', type: 'expense', color: '#84cc16', icon: 'zap', isFixed: true, isDefault: true },
  { id: 'cat-salute', name: 'Salute', type: 'expense', color: '#22c55e', icon: 'heart-pulse', isFixed: false, isDefault: true },
  { id: 'cat-abbonamenti', name: 'Abbonamenti', type: 'expense', color: '#14b8a6', icon: 'repeat', isFixed: true, isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', color: '#06b6d4', icon: 'bag', isFixed: false, isDefault: true },
  { id: 'cat-viaggi', name: 'Viaggi', type: 'expense', color: '#3b82f6', icon: 'plane', isFixed: false, isDefault: true },
  { id: 'cat-formazione', name: 'Formazione', type: 'expense', color: '#6366f1', icon: 'book', isFixed: false, isDefault: true },
  { id: 'cat-altre-spese', name: 'Altre spese', type: 'expense', color: '#64748b', icon: 'more-horizontal', isFixed: false, isDefault: true },
  { id: 'cat-investimenti', name: 'Investimenti', type: 'investment', color: '#8b5cf6', icon: 'trending-up', isFixed: false, isDefault: true },
  { id: 'cat-stipendio', name: 'Stipendio', type: 'income', color: '#10b981', icon: 'wallet', isFixed: false, isDefault: true },
  { id: 'cat-altre-entrate', name: 'Altre entrate', type: 'income', color: '#059669', icon: 'plus-circle', isFixed: false, isDefault: true },
  { id: 'cat-trasferimenti', name: 'Trasferimenti', type: 'transfer', color: '#94a3b8', icon: 'arrow-left-right', isFixed: false, isDefault: true },
]
