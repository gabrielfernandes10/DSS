import { FormEvent, useEffect, useState } from 'react'
import { ClipboardList, Filter, LoaderCircle, Plus, RefreshCw, Search, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, SelectField, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

type RequestStatus = 'new' | 'in_review' | 'quoted' | 'scheduled' | 'closed'
type Priority = 'low' | 'normal' | 'high' | 'urgent'

interface Customer { id: string; full_name: string }
interface ServiceType { id: string; name: string }
interface ServiceRequest { id: string; customer_id: string | null; service_type_id: string | null; subject: string | null; description: string | null; status: RequestStatus; priority: Priority; created_at: string }
interface RequestForm { customer_id: string; service_type_id: string; subject: string; description: string; priority: Priority }

const emptyForm: RequestForm = { customer_id: '', service_type_id: '', subject: '', description: '', priority: 'normal' }
const statusLabels: Record<RequestStatus, string> = { new: 'Nova', in_review: 'Em análise', quoted: 'Orçada', scheduled: 'Agendada', closed: 'Encerrada' }
const priorityLabels: Record<Priority, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }

export function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [form, setForm] = useState<RequestForm>(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadRequests() {
    if (!supabase) { setError('A integração com o Supabase não está disponível.'); setLoading(false); return }
    setLoading(true)
    setError('')
    const [requestResult, customerResult, serviceResult] = await Promise.all([
      supabase.from('service_requests').select('id, customer_id, service_type_id, subject, description, status, priority, created_at').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name').order('full_name'),
      supabase.from('service_types').select('id, name').eq('active', true).order('name'),
    ])
    const firstError = [requestResult, customerResult, serviceResult].find((result) => result.error)
    if (firstError?.error) setError(`Não foi possível carregar as solicitações: ${firstError.error.message}`)
    else { setRequests((requestResult.data ?? []) as ServiceRequest[]); setCustomers((customerResult.data ?? []) as Customer[]); setServiceTypes((serviceResult.data ?? []) as ServiceType[]) }
    setLoading(false)
  }

  useEffect(() => { void loadRequests() }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    setNotice('')
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) { setError('Sua sessão expirou. Faça login novamente.'); setSaving(false); return }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('id', userId).single()
    if (profileError || !profile?.company_id) { setError('Finalize o primeiro acesso da empresa antes de cadastrar solicitações.'); setSaving(false); return }
    const { error: insertError } = await supabase.from('service_requests').insert({ company_id: profile.company_id, customer_id: form.customer_id || null, service_type_id: form.service_type_id || null, subject: form.subject.trim() || null, description: form.description.trim() || null, priority: form.priority, source: 'admin' })
    if (insertError) { setError(`Não foi possível salvar a solicitação: ${insertError.message}`); setSaving(false); return }
    setForm(emptyForm)
    setShowForm(false)
    setNotice('Solicitação cadastrada com sucesso.')
    setSaving(false)
    await loadRequests()
  }

  async function updateStatus(id: string, status: RequestStatus) {
    if (!supabase) return
    setError('')
    const { error: updateError } = await supabase.from('service_requests').update({ status }).eq('id', id)
    if (updateError) setError(`Não foi possível atualizar o status: ${updateError.message}`)
    else { setNotice('Status atualizado.'); await loadRequests() }
  }

  const customerNames = new Map(customers.map((customer) => [customer.id, customer.full_name]))
  const serviceNames = new Map(serviceTypes.map((service) => [service.id, service.name]))
  const filteredRequests = requests.filter((request) => {
    const haystack = `${request.subject ?? ''} ${request.description ?? ''} ${customerNames.get(request.customer_id ?? '') ?? ''} ${serviceNames.get(request.service_type_id ?? '') ?? ''}`.toLowerCase()
    return (statusFilter === 'all' || request.status === statusFilter) && haystack.includes(search.toLowerCase())
  })

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">Entrada</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Solicitações</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Acompanhe pedidos de orçamento e assistência que chegam pelos canais da DSS.</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => void loadRequests()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={() => { setShowForm(true); setNotice(''); setError('') }}><Plus className="h-4 w-4" /> Nova solicitação</Button></div></div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Nova entrada</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">Registrar solicitação</h3></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2"><SelectField label="Cliente" value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })}><option value="">Sem cliente vinculado</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.full_name}</option>)}</SelectField><SelectField label="Tipo de serviço" value={form.service_type_id} onChange={(event) => setForm({ ...form, service_type_id: event.target.value })}><option value="">Nenhum serviço selecionado</option>{serviceTypes.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}</SelectField><Field label="Assunto" className="md:col-span-2" placeholder="Ex.: Instalação de câmeras no condomínio" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /><SelectField label="Prioridade" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></SelectField><TextArea label="Descrição" className="md:col-span-2" placeholder="Detalhe o pedido do cliente" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : 'Salvar solicitação'}</Button></div></form></section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Fila operacional</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando solicitações…' : `${requests.length} ${requests.length === 1 ? 'solicitação registrada' : 'solicitações registradas'}`}</h3></div><div className="flex flex-col gap-3 sm:flex-row"><label className="relative block sm:w-64"><span className="sr-only">Buscar solicitações</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Buscar solicitação" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="relative block sm:w-44"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select className="w-full appearance-none rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos status</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div></div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : filteredRequests.length === 0 ? <div className="mt-7"><EmptyState icon={<ClipboardList className="h-5 w-5" />} title={search || statusFilter !== 'all' ? 'Nenhum resultado encontrado' : 'Nenhuma solicitação registrada'} description={search || statusFilter !== 'all' ? 'Ajuste a busca ou o filtro para encontrar outras solicitações.' : 'Registre a primeira solicitação da DSS para iniciar o acompanhamento operacional.'} /></div> : <div className="mt-7 space-y-3">{filteredRequests.map((request) => <div key={request.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-navy">{request.subject || 'Solicitação sem assunto'}</p><span className="rounded-full bg-cyan/10 px-2.5 py-1 text-[10px] font-bold text-brand">{priorityLabels[request.priority]}</span></div><p className="mt-1 text-xs text-slate-500">{customerNames.get(request.customer_id ?? '') || 'Sem cliente'} {serviceNames.get(request.service_type_id ?? '') ? `· ${serviceNames.get(request.service_type_id ?? '')}` : ''} · {new Date(request.created_at).toLocaleDateString('pt-BR')}</p></div><select className="rounded-full border border-line bg-mist px-3 py-2 text-xs font-bold text-navy outline-none focus:border-brand" value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value as RequestStatus)} aria-label={`Status de ${request.subject || 'solicitação'}`}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>)}</div>}</section>
  </div>
}
