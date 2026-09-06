import { NavLink, Outlet } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutDashboard, List, PieChart, Target, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { db } from '@/db/db'

interface TabDef {
  to: string
  label: string
  icon: LucideIcon
}

const TABS: TabDef[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transazioni', label: 'Transazioni', icon: List },
  { to: '/portafoglio', label: 'Portafoglio', icon: PieChart },
  { to: '/budget', label: 'Budget', icon: Target },
  { to: '/impostazioni', label: 'Impostazioni', icon: Settings },
]

export function AppLayout() {
  const uncategorizedCount = useLiveQuery(() => db.transactions.filter((t) => !t.categoryId).count(), [], 0)

  return (
    <div className="flex h-full min-h-screen flex-col bg-gray-100 pt-safe-t dark:bg-gray-950">
      <main className="no-scrollbar flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 pb-safe-b backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/90"
        aria-label="Navigazione principale"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `tap-target relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                  {to === '/transazioni' && uncategorizedCount > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold text-white">
                      {uncategorizedCount > 99 ? '99+' : uncategorizedCount}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
