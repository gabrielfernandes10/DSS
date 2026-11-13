import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AuthGuard } from '../features/auth/AuthGuard'
import { AboutPage } from '../pages/public/AboutPage'
import { AssistancePage } from '../pages/public/AssistancePage'
import { BudgetPage } from '../pages/public/BudgetPage'
import { ContactPage } from '../pages/public/ContactPage'
import { HomePage } from '../pages/public/HomePage'
import { ServicesPage } from '../pages/public/ServicesPage'
import { CustomersPage } from '../pages/admin/CustomersPage'
import { RequestsPage } from '../pages/admin/RequestsPage'
import { ServiceTypesPage } from '../pages/admin/ServiceTypesPage'
import { QuotesPage } from '../pages/admin/QuotesPage'
import { QuotePrintPage } from '../pages/admin/QuotePrintPage'
import { ServiceOrdersPage } from '../pages/admin/ServiceOrdersPage'
import { ServiceOrderDetailsPage } from '../pages/admin/ServiceOrderDetailsPage'
import { AppointmentsPage } from '../pages/admin/AppointmentsPage'
import { FinancePage } from '../pages/admin/FinancePage'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { FirstAccessPage } from '../pages/admin/FirstAccessPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { ModulePage } from '../pages/admin/ModulePage'
import { SettingsPage } from '../pages/admin/SettingsPage'

function NotFoundPage() {
  return <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">404</p><h1 className="mt-4 font-display text-4xl font-extrabold text-navy">Página não encontrada.</h1><p className="mt-4 text-slate-600">O endereço pode ter mudado. Volte ao início para continuar.</p><a href="/" className="mt-7 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white">Voltar ao início</a></div>
}

function HomeEntryPage() {
  return <HomePage />
}

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomeEntryPage />} />
      <Route path="/servicos" element={<ServicesPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/orcamento" element={<BudgetPage />} />
      <Route path="/assistencia" element={<AssistancePage />} />
      <Route path="/contato" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="/painel/login" element={<LoginPage />} />
    <Route path="/painel/primeiro-acesso" element={<FirstAccessPage />} />
    <Route path="/painel" element={<AuthGuard><AdminLayout /></AuthGuard>}>
      <Route index element={<DashboardPage />} />
      <Route path="clientes" element={<CustomersPage />} />
      <Route path="solicitacoes" element={<RequestsPage />} />
      <Route path="servicos" element={<ServiceTypesPage />} />
      <Route path="orcamentos" element={<QuotesPage />} />
      <Route path="orcamentos/:id/imprimir" element={<QuotePrintPage />} />
      <Route path="ordens" element={<ServiceOrdersPage />} />
      <Route path="ordens/:id" element={<ServiceOrderDetailsPage />} />
      <Route path="agenda" element={<AppointmentsPage />} />
      <Route path="financeiro" element={<FinancePage />} />
      <Route path="configuracoes" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Route>
  </Routes>
}
