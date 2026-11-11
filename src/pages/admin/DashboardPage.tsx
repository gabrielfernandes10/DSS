import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, ClipboardList, DollarSign, LoaderCircle, RefreshCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

interface DashboardStats {
  customers: number
  requests: number
  appointments: number
  balance: number
}

interface RecentRequest {
  id: string
  subject: string | null
  status: string
  created_at: string
}

const emptyStats: DashboardStats = { customers: 0, requests: 0, appointments: 0, balance: 0 }

const statusLabels: Record<string, string> = {
  new: 'Nova',
  in_review: 'Em análise',
  quoted: 'Orçada',
  scheduled: 'Agendada',
  closed: 'Encerrada',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function DashboardPage() {
  const [stats, setStats] = useState(emptyStats)
  const [activities, setActivities] = useState<RecentRequest[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unavailable'>('loading')

  async function loadDashboard() {
    if (!supabase) { setState('unavailable'); return }
    setState('loading')
    const [customers, requests, appointments, finances, recentRequests] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('service_requests').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('financial_transactions').select('amount, type'),
      supabase.from('service_requests').select('id, subject, status, created_at').order('created_at', { ascending: false }).limit(5),
    ])
    const firstError = [customers, requests, appointments, finances, recentRequests].find((result) => result.error)
    if (firstError?.error) { setState('error'); return }
    const balance = (finances.data ?? []).reduce((total, transaction) => total + (transaction.type === 'expense' ? -Number(transaction.amount) : Number(transaction.amount)), 0)
    setStats({ customers: customers.count ?? 0, requests: requests.count ?? 0, appointments: appointments.count ?? 0, balance })
    setActivities((recentRequests.data ?? []) as RecentRequest[])
    setState('ready')
  }

  useEffect(() => { void loadDashboard() }, [])

  const cards = useMemo(() => [
    { label: 'Clientes', value: stats.customers.toString(), icon: Users, to: '/painel/clientes' },
    { label: 'Solicitações', value: stats.requests.toString(), icon: ClipboardList, to: '/painel/solicitacoes' },
    { label: 'Agenda', value: stats.appointments.toString(), icon: CalendarDays, to: '/painel/agenda' },
    { label: 'Saldo', value: formatCurrency(stats.balance), icon: DollarSign, to: '/painel/financeiro' },
  ], [stats])

  const isLoading = state === 'loading'
  const hasError = state === 'error' || state === 'unavailable'

  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><Badge tone="blue">Visão geral</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Bom trabalho, vamos organizar o dia.</h2><p className="mt-3 text-sm text-slate-500">{state === 'ready' ? 'Dados atualizados diretamente do Supabase com as regras RLS da sua empresa.' : 'Consultando os dados da operação DSS…'}</p></div>
      <Button variant="secondary" onClick={() => void loadDashboard()} disabled={isLoading}><RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button>
    </div>

    {hasError && <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p>{state === 'unavailable' ? 'As variáveis do Supabase não estão disponíveis neste ambiente.' : 'Não foi possível consultar os dados. Confirme se a migration foi aplicada e se o usuário possui um perfil owner ou staff.'}</p></div><Link to="/painel/configuracoes" className="font-bold text-brand hover:underline">Ver configurações</Link></div>}

    <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, to }) => <Link to={to} key={label} className="group rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan/50 hover:shadow-panel"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-brand"><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand" /></div><p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1 min-h-10 font-display text-3xl font-extrabold text-navy">{isLoading ? <LoaderCircle className="mt-1 h-7 w-7 animate-spin text-brand" /> : value}</p></Link>)}</div>

    <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-3xl border border-line bg-white p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Atividade recente</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">Acompanhe o movimento</h3></div><span className="rounded-full bg-mist px-3 py-1.5 text-[11px] font-bold text-slate-500">{activities.length ? `${activities.length} recentes` : 'Sem dados'}</span></div>{activities.length ? <div className="mt-7 space-y-3">{activities.map((activity) => <div key={activity.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-mist/40 p-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-navy">{activity.subject || 'Solicitação sem assunto'}</p><p className="mt-1 text-xs text-slate-500">{new Date(activity.created_at).toLocaleDateString('pt-BR')}</p></div><span className="shrink-0 rounded-full bg-cyan/10 px-3 py-1 text-[11px] font-bold text-brand">{statusLabels[activity.status] ?? activity.status}</span></div>)}</div> : <div className="mt-7"><EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Nenhuma atividade registrada" description="Solicitações, orçamentos e ordens de serviço aparecerão neste espaço quando forem cadastrados." /></div>}</section><section className="rounded-3xl bg-navy p-6 text-white sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan">Operação DSS</p><h3 className="mt-3 font-display text-2xl font-extrabold">Dados protegidos por empresa.</h3><p className="mt-4 text-sm leading-6 text-white/60">Cada consulta é filtrada pelas políticas RLS do Supabase. Clientes, solicitações e financeiro ficam isolados dentro da empresa do usuário autenticado.</p><div className="mt-7 flex items-center gap-2 text-sm font-bold text-cyan"><CheckCircle2 className="h-4 w-4" /> RLS ativo na camada de dados</div></section></div>
  </div>
}
