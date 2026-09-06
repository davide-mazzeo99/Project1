import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/db/db'
import { CategoryIcon } from '@/lib/icons'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { addCategory, deleteCategory, updateCategory } from '@/db/repo/categories'
import type { Category, CategoryType } from '@/types'

const TYPE_LABELS: Record<CategoryType, string> = {
  income: 'Entrata',
  expense: 'Uscita',
  investment: 'Investimento',
  transfer: 'Trasferimento',
}

const ICON_OPTIONS = [
  'home', 'shopping-cart', 'utensils', 'bus', 'zap', 'heart-pulse', 'repeat', 'bag',
  'plane', 'book', 'more-horizontal', 'trending-up', 'wallet', 'plus-circle', 'arrow-left-right',
]

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#64748b',
]

type Draft = Omit<Category, 'id' | 'isDefault'> & { id?: string }

const EMPTY_DRAFT: Draft = {
  name: '',
  type: 'expense',
  color: COLOR_OPTIONS[0],
  icon: 'more-horizontal',
  isFixed: false,
}

export function CategoriesPage() {
  const { showToast } = useToast()
  const categories = useLiveQuery(
    () => db.categories.toArray().then((cs) => cs.sort((a, b) => a.name.localeCompare(b.name, 'it'))),
    [],
  )
  const [draft, setDraft] = useState<Draft | null>(null)

  async function handleSave() {
    if (!draft || !draft.name.trim()) return
    if (draft.id) {
      await updateCategory(draft.id, draft)
      showToast('Categoria aggiornata')
    } else {
      await addCategory(draft)
      showToast('Categoria creata')
    }
    setDraft(null)
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id)
    if (result.ok) {
      showToast('Categoria eliminata')
      setDraft(null)
    } else {
      showToast(result.reason)
    }
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-2 flex items-center gap-2">
        <Link
          to="/impostazioni"
          className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categorie</h1>
      </div>

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:divide-gray-800 dark:bg-gray-900">
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setDraft(cat)}
            className="tap-target flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-gray-50 dark:active:bg-gray-800/60"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: cat.color }}
            >
              <CategoryIcon name={cat.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{cat.name}</span>
              <span className="block text-xs text-gray-400">
                {TYPE_LABELS[cat.type]}
                {cat.isFixed ? ' · fissa' : ''}
                {cat.monthlyBudget ? ` · budget ${cat.monthlyBudget}€` : ''}
              </span>
            </span>
            {cat.isDefault && <Lock className="h-3.5 w-3.5 shrink-0 text-gray-300" />}
            <Pencil className="h-4 w-4 shrink-0 text-gray-300" />
          </button>
        ))}
      </div>

      <button
        onClick={() => setDraft({ ...EMPTY_DRAFT })}
        className="tap-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> Nuova categoria
      </button>

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Modifica categoria' : 'Nuova categoria'}
        footer={
          <div className="flex gap-2">
            {draft?.id && (
              <button
                onClick={() => handleDelete(draft.id!)}
                className="tap-target flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600 active:bg-red-100 dark:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              className="tap-target flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
            >
              Salva
            </button>
          </div>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Nome
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Tipo
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as CategoryType })}
                disabled={!!draft.id}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Colore</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft({ ...draft, color })}
                    className={`h-8 w-8 rounded-full ${draft.color === color ? 'ring-2 ring-offset-2 ring-brand-600 dark:ring-offset-gray-900' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Icona</p>
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setDraft({ ...draft, icon })}
                    className={`tap-target flex items-center justify-center rounded-lg border ${
                      draft.icon === icon
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <CategoryIcon name={icon} className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Budget mensile (opzionale, €)
              <input
                type="number"
                inputMode="decimal"
                value={draft.monthlyBudget ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, monthlyBudget: e.target.value ? Number.parseFloat(e.target.value) : undefined })
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
              Spesa fissa (es. affitto, abbonamenti)
              <input
                type="checkbox"
                checked={draft.isFixed}
                onChange={(e) => setDraft({ ...draft, isFixed: e.target.checked })}
                className="h-5 w-5"
              />
            </label>
          </div>
        )}
      </Sheet>
    </div>
  )
}
