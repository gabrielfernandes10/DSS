import { CalendarDays, CircleDollarSign, ClipboardList, FileText, Users, Wrench } from 'lucide-react'
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
import { DashboardPage } from '../pages/admin/DashboardPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { ModulePage } from '../pages/admin/ModulePage'
import { SettingsPage } from '../pages/admin/SettingsPage'

function NotFoundPage() {
  return <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 text-center"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">404</p><h1 className="mt-4 font-display text-4xl font-extrabold text-navy">Página não encontrada.</h1><p className="mt-4 text-slate-600">O endereço pode ter mudado. Volte ao início para continuar.</p><a href="/" className="mt-7 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white">Voltar ao início</a></div>
}

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/servicos" element={<ServicesPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/orcamento" element={<BudgetPage />} />
      <Route path="/assistencia" element={<AssistancePage />} />
      <Route path="/contato" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="/painel/login" element={<LoginPage />} />
    <Route path="/painel" element={<AuthGuard><AdminLayout /></AuthGuard>}>
      <Route index element={<DashboardPage />} />
      <Route path="clientes" element={<ModulePage eyebrow="Relacionamento" title="Clientes" description="Organize pessoas e condomínios atendidos pela DSS, com seus endereços e histórico de relacionamento." icon={Users} actionLabel="Novo cliente" />} />
      <Route path="solicitacoes" element={<ModulePage eyebrow="Entrada" title="Solicitações" description="Acompanhe pedidos de orçamento e assistência que chegam pelos canais da DSS." icon={ClipboardList} actionLabel="Nova solicitação" />} />
      <Route path="orcamentos" element={<ModulePage eyebrow="Comercial" title="Orçamentos" description="Estruture propostas, itens e status de aprovação sem perder o contexto do pedido original." icon={FileText} actionLabel="Novo orçamento" />} />
      <Route path="ordens" element={<ModulePage eyebrow="Operação" title="Ordens de serviço" description="Transforme serviços aprovados em execução organizada, com prioridade e responsável." icon={Wrench} actionLabel="Nova ordem" />} />
      <Route path="agenda" element={<ModulePage eyebrow="Operação" title="Agenda" description="Visualize visitas, instalações e manutenções em um só lugar." icon={CalendarDays} actionLabel="Novo agendamento" />} />
      <Route path="financeiro" element={<ModulePage eyebrow="Gestão" title="Financeiro" description="Acompanhe receitas e despesas vinculadas à operação, com clareza para a gestão." icon={CircleDollarSign} actionLabel="Nova movimentação" />} />
      <Route path="configuracoes" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Route>
  </Routes>
}
