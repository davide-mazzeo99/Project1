import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { BudgetPage } from '@/pages/BudgetPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transazioni" element={<TransactionsPage />} />
            <Route path="/portafoglio" element={<PortfolioPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/impostazioni" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
