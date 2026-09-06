import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { CategoryIcon } from '@/lib/icons'
import type { Category, CategoryType } from '@/types'

interface CategoryGridProps {
  selectedId?: string | null
  onSelect: (category: Category) => void
  /** Restrict to these types; omit to show all. */
  types?: CategoryType[]
}

export function CategoryGrid({ selectedId, onSelect, types }: CategoryGridProps) {
  const categories = useLiveQuery(async () => {
    const all = await db.categories.toArray()
    const filtered = types ? all.filter((c) => types.includes(c.type)) : all
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  }, [types?.join(',')])

  if (!categories) return null

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {categories.map((cat) => {
        const active = selectedId === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat)}
            className={`tap-target flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors ${
              active
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                : 'border-gray-100 bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50'
            }`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: cat.color }}
            >
              <CategoryIcon name={cat.icon} className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 text-[11px] font-medium leading-tight text-gray-700 dark:text-gray-300">
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
