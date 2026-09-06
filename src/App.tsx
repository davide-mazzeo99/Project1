import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { BudgetPage } from '@/pages/BudgetPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { ImportPage } from '@/pages/ImportPage'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transazioni" element={<TransactionsPage />} />
              <Route path="/portafoglio" element={<PortfolioPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/impostazioni" element={<SettingsPage />} />
              <Route path="/impostazioni/categorie" element={<CategoriesPage />} />
              <Route path="/importa" element={<ImportPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
