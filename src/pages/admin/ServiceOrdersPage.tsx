import { FormEvent, useEffect, useState } from 'react'
import { CalendarClock, ClipboardCheck, Edit3, LoaderCircle, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, SelectField, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

type OrderStatus = 'open' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
type Priority = 'low' | 'normal' | 'high' | 'urgent'
interface Customer { id: string; full_name: string }
interface Quote { id: string; customer_id: string | null; total: number; status: string }
interface Request { id: string; subject: string | null }
interface Profile { id: string; full_name: string }
interface Order { id: string; customer_id: string | null; quote_id: string | null; request_id: string | null; assigned_profile_id: string | null; status: OrderStatus; priority: Priority; description: string | null; scheduled_for: string | null; created_at: string }
interface OrderForm { customer_id: string; quote_id: string; request_id: string; assigned_profile_id: string; priority: Priority; description: string; scheduled_for: string }

const emptyForm: OrderForm = { customer_id: '', quote_id: '', request_id: '', assigned_profile_id: '', priority: 'normal', description: '', scheduled_for: '' }
const statusLabels: Record<OrderStatus, string> = { open: 'Aberta', scheduled: 'Agendada', in_progress: 'Em execução', completed: 'Concluída', cancelled: 'Cancelada' }
const priorityLabels: Record<Priority, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }

function localDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function ServiceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<OrderStatus>('open')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadOrders() {
    if (!supabase) { setError('A integração com o Supabase não está disponível.'); setLoading(false); return }
    setLoading(true); setError('')
    const [ordersResult, customersResult, quotesResult, requestsResult, profilesResult] = await Promise.all([
      supabase.from('service_orders').select('id, customer_id, quote_id, request_id, assigned_profile_id, status, priority, description, scheduled_for, created_at').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name').order('full_name'),
      supabase.from('quotes').select('id, customer_id, total, status').order('created_at', { ascending: false }),
      supabase.from('service_requests').select('id, subject').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    ])
    const firstError = [ordersResult, customersResult, quotesResult, requestsResult, profilesResult].find((result) => result.error)
    if (firstError?.error) setError(`Não foi possível carregar as ordens: ${firstError.error.message}`)
    else { setOrders((ordersResult.data ?? []) as Order[]); setCustomers((customersResult.data ?? []) as Customer[]); setQuotes((quotesResult.data ?? []) as Quote[]); setRequests((requestsResult.data ?? []) as Request[]); setProfiles((profilesResult.data ?? []) as Profile[]) }
    setLoading(false)
  }

  useEffect(() => { void loadOrders() }, [])

  function startNew() {
    setEditingId(null); setEditingStatus('open'); setForm(emptyForm); setShowForm(true); setNotice(''); setError('')
  }

  function startEdit(order: Order) {
    setEditingId(order.id)
    setEditingStatus(order.status)
    setForm({ customer_id: order.customer_id || '', quote_id: order.quote_id || '', request_id: order.request_id || '', assigned_profile_id: order.assigned_profile_id || '', priority: order.priority, description: order.description || '', scheduled_for: localDateTime(order.scheduled_for) })
    setShowForm(true); setNotice(''); setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true); setError(''); setNotice('')
    const payload = { customer_id: form.customer_id || null, quote_id: form.quote_id || null, request_id: form.request_id || null, assigned_profile_id: form.assigned_profile_id || null, status: editingId ? editingStatus : (form.scheduled_for ? 'scheduled' : 'open'), priority: form.priority, description: form.description.trim() || null, scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null }
    let result: { error: { message: string } | null }
    if (editingId) {
      result = await supabase.from('service_orders').update(payload).eq('id', editingId)
    } else {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) { setError('Sua sessão expirou. Faça login novamente.'); setSaving(false); return }
      const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('id', userId).single()
      if (profileError || !profile?.company_id) { setError('Finalize o primeiro acesso da empresa antes de cadastrar ordens.'); setSaving(false); return }
      result = await supabase.from('service_orders').insert({ company_id: profile.company_id, ...payload })
    }
    if (result.error) setError(`Não foi possível ${editingId ? 'atualizar' : 'salvar'} a ordem: ${result.error.message}`)
    else { setForm(emptyForm); setEditingId(null); setShowForm(false); setNotice(editingId ? 'Ordem de serviço atualizada.' : 'Ordem de serviço criada com sucesso.'); await loadOrders() }
    setSaving(false)
  }

  async function updateStatus(id: string, status: OrderStatus) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('service_orders').update({ status }).eq('id', id)
    if (updateError) setError(`Não foi possível atualizar a ordem: ${updateError.message}`)
    else { setNotice('Status da ordem atualizado.'); await loadOrders() }
  }

  async function deleteOrder(order: Order) {
    if (!supabase || !window.confirm('Excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) return
    const { error: deleteError } = await supabase.from('service_orders').delete().eq('id', order.id)
    if (deleteError) setError(`Não foi possível excluir a ordem: ${deleteError.message}`)
    else { setNotice('Ordem de serviço excluída.'); await loadOrders() }
  }

  const customerNames = new Map(customers.map((customer) => [customer.id, customer.full_name]))
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name]))
  const filteredOrders = orders.filter((order) => `${customerNames.get(order.customer_id ?? '') ?? ''} ${order.description ?? ''} ${profileNames.get(order.assigned_profile_id ?? '') ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">Operação</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Ordens de serviço</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Transforme o trabalho aprovado em execução organizada, com responsável, prioridade e agendamento.</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => void loadOrders()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={startNew}><Plus className="h-4 w-4" /> Nova ordem</Button></div></div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">{editingId ? 'Editar execução' : 'Nova execução'}</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">{editingId ? 'Editar ordem de serviço' : 'Criar ordem de serviço'}</h3></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2"><SelectField label="Cliente" value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })}><option value="">Sem cliente vinculado</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.full_name}</option>)}</SelectField><SelectField label="Orçamento" value={form.quote_id} onChange={(event) => setForm({ ...form, quote_id: event.target.value })}><option value="">Sem orçamento vinculado</option>{quotes.map((quote) => <option value={quote.id} key={quote.id}>{customerNames.get(quote.customer_id ?? '') || 'Sem cliente'} · R$ {Number(quote.total).toFixed(2).replace('.', ',')} · {quote.status}</option>)}</SelectField><SelectField label="Solicitação de origem" value={form.request_id} onChange={(event) => setForm({ ...form, request_id: event.target.value })}><option value="">Sem solicitação vinculada</option>{requests.map((request) => <option value={request.id} key={request.id}>{request.subject || 'Solicitação sem assunto'}</option>)}</SelectField><SelectField label="Responsável" value={form.assigned_profile_id} onChange={(event) => setForm({ ...form, assigned_profile_id: event.target.value })}><option value="">Ainda não atribuído</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name}</option>)}</SelectField><SelectField label="Prioridade" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></SelectField><Field label="Agendar para" type="datetime-local" value={form.scheduled_for} onChange={(event) => setForm({ ...form, scheduled_for: event.target.value })} /><TextArea label="Descrição do serviço" className="md:col-span-2" placeholder="Descreva o que precisa ser executado" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : editingId ? 'Atualizar ordem' : 'Salvar ordem'}</Button></div></form></section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Execução operacional</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando ordens…' : `${orders.length} ${orders.length === 1 ? 'ordem registrada' : 'ordens registradas'}`}</h3></div><label className="relative block sm:w-72"><span className="sr-only">Buscar ordens</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Buscar ordem" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : filteredOrders.length === 0 ? <div className="mt-7"><EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title={search ? 'Nenhum resultado encontrado' : 'Nenhuma ordem registrada'} description={search ? 'Tente buscar por outro cliente ou responsável.' : 'Crie a primeira ordem de serviço da DSS.'} /></div> : <div className="mt-7 space-y-3">{filteredOrders.map((order) => <div key={order.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-navy">{customerNames.get(order.customer_id ?? '') || 'Sem cliente vinculado'}</p><span className="rounded-full bg-cyan/10 px-2.5 py-1 text-[10px] font-bold text-brand">{priorityLabels[order.priority]}</span></div><p className="mt-1 text-xs text-slate-500">{order.scheduled_for ? <><CalendarClock className="mr-1 inline h-3.5 w-3.5" />{new Date(order.scheduled_for).toLocaleString('pt-BR')}</> : 'Sem agendamento'}{order.assigned_profile_id ? ` · ${profileNames.get(order.assigned_profile_id) || 'Responsável'}` : ''}</p><p className="mt-1 max-w-2xl text-sm text-slate-600">{order.description || 'Sem descrição cadastrada.'}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => startEdit(order)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-brand" aria-label="Editar ordem"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => void deleteOrder(order)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir ordem"><Trash2 className="h-4 w-4" /></button><select className="rounded-full border border-line bg-mist px-3 py-2 text-xs font-bold text-navy outline-none focus:border-brand" value={order.status} onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)} aria-label="Status da ordem">{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div></div>)}</div>}</section>
  </div>
}
