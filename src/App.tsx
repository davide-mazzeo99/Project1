import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { PageLoading } from '@/components/PageLoading'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const BudgetPage = lazy(() => import('@/pages/BudgetPage').then((m) => ({ default: m.BudgetPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })))
const ImportPage = lazy(() => import('@/pages/ImportPage').then((m) => ({ default: m.ImportPage })))
const RulesPage = lazy(() => import('@/pages/RulesPage').then((m) => ({ default: m.RulesPage })))
const AccountDetailPage = lazy(() => import('@/pages/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage })))
const PeoplePage = lazy(() => import('@/pages/PeoplePage').then((m) => ({ default: m.PeoplePage })))
const MarketsPage = lazy(() => import('@/pages/MarketsPage').then((m) => ({ default: m.MarketsPage })))

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HashRouter>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/transazioni" element={<TransactionsPage />} />
                <Route path="/portafoglio" element={<PortfolioPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/impostazioni" element={<SettingsPage />} />
                <Route path="/impostazioni/categorie" element={<CategoriesPage />} />
                <Route path="/importa" element={<ImportPage />} />
                <Route path="/impostazioni/regole" element={<RulesPage />} />
                <Route path="/conti/:accountId" element={<AccountDetailPage />} />
                <Route path="/impostazioni/persone" element={<PeoplePage />} />
                <Route path="/mercati" element={<MarketsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
