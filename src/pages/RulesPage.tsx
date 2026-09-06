import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/db/db'
import { CategoryIcon } from '@/lib/icons'
import { deleteRule } from '@/db/repo/rules'
import { useToast } from '@/components/ui/Toast'

export function RulesPage() {
  const { showToast } = useToast()
  const rules = useLiveQuery(() => db.rules.orderBy('priority').toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const categoryById = new Map(categories?.map((c) => [c.id, c]) ?? [])

  async function handleDelete(id: string) {
    await deleteRule(id)
    showToast('Regola eliminata')
  }

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-2 flex items-center gap-2">
        <Link
          to="/impostazioni"
          className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Regole di categorizzazione</h1>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        Create automaticamente quando categorizzi una transazione da "Da categorizzare", oppure applicate durante
        l'import CSV. Vengono valutate in ordine; la prima che corrisponde alla descrizione vince.
      </p>

      {rules?.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-400">
          Nessuna regola ancora. Ne vengono proposte automaticamente quando assegni una categoria a una transazione.
        </p>
      )}

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:divide-gray-800 dark:bg-gray-900">
        {rules?.map((rule) => {
          const category = categoryById.get(rule.categoryId)
          return (
            <div key={rule.id} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: category?.color ?? '#94a3b8' }}
              >
                <CategoryIcon name={category?.icon ?? 'more-horizontal'} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {rule.matchType === 'regex' ? `/${rule.pattern}/` : `"${rule.pattern}"`}
                </span>
                <span className="block truncate text-xs text-gray-400">→ {category?.name ?? 'Categoria eliminata'}</span>
              </span>
              <button
                onClick={() => handleDelete(rule.id)}
                className="tap-target flex items-center justify-center text-gray-300 active:text-red-500"
                aria-label="Elimina regola"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
