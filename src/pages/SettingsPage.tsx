import { ChevronRight, Tag, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Impostazioni</h1>

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:divide-gray-800 dark:bg-gray-900">
        <Link
          to="/impostazioni/categorie"
          className="tap-target flex items-center gap-3 px-3 py-3 active:bg-gray-50 dark:active:bg-gray-800/60"
        >
          <Tag className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">Categorie</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>
        <Link
          to="/impostazioni/regole"
          className="tap-target flex items-center gap-3 px-3 py-3 active:bg-gray-50 dark:active:bg-gray-800/60"
        >
          <Wand2 className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">Regole di categorizzazione</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>
      </div>
    </div>
  )
}
