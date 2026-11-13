import { FormEvent, useEffect, useState } from 'react'
import { CalendarDays, CalendarPlus, LoaderCircle, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, SelectField, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
interface Customer { id: string; full_name: string }
interface Order { id: string; customer_id: string | null; description: string | null }
interface Profile { id: string; full_name: string }
interface Appointment { id: string; customer_id: string | null; service_order_id: string | null; assigned_profile_id: string | null; starts_at: string; ends_at: string; status: AppointmentStatus; notes: string | null }
interface AppointmentForm { customer_id: string; service_order_id: string; assigned_profile_id: string; starts_at: string; ends_at: string; notes: string }

const emptyForm: AppointmentForm = { customer_id: '', service_order_id: '', assigned_profile_id: '', starts_at: '', ends_at: '', notes: '' }
const statusLabels: Record<AppointmentStatus, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' }

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadAppointments() {
    if (!supabase) { setError('A integração com o Supabase não está disponível.'); setLoading(false); return }
    setLoading(true); setError('')
    const [appointmentsResult, customersResult, ordersResult, profilesResult] = await Promise.all([
      supabase.from('appointments').select('id, customer_id, service_order_id, assigned_profile_id, starts_at, ends_at, status, notes').order('starts_at'),
      supabase.from('customers').select('id, full_name').order('full_name'),
      supabase.from('service_orders').select('id, customer_id, description').not('status', 'eq', 'cancelled').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    ])
    const firstError = [appointmentsResult, customersResult, ordersResult, profilesResult].find((result) => result.error)
    if (firstError?.error) setError(`Não foi possível carregar a agenda: ${firstError.error.message}`)
    else { setAppointments((appointmentsResult.data ?? []) as Appointment[]); setCustomers((customersResult.data ?? []) as Customer[]); setOrders((ordersResult.data ?? []) as Order[]); setProfiles((profilesResult.data ?? []) as Profile[]) }
    setLoading(false)
  }

  useEffect(() => { void loadAppointments() }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (!form.starts_at || !form.ends_at || new Date(form.ends_at) <= new Date(form.starts_at)) { setError('Informe início e fim válidos. O fim deve ser posterior ao início.'); return }
    setSaving(true); setError(''); setNotice('')
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) { setError('Sua sessão expirou. Faça login novamente.'); setSaving(false); return }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('id', userId).single()
    if (profileError || !profile?.company_id) { setError('Finalize o primeiro acesso da empresa antes de criar agendamentos.'); setSaving(false); return }
    const { error: insertError } = await supabase.from('appointments').insert({ company_id: profile.company_id, customer_id: form.customer_id || null, service_order_id: form.service_order_id || null, assigned_profile_id: form.assigned_profile_id || null, starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString(), status: 'scheduled', notes: form.notes.trim() || null })
    if (insertError) setError(`Não foi possível salvar o agendamento: ${insertError.message}`)
    else { setForm(emptyForm); setShowForm(false); setNotice('Agendamento criado com sucesso.'); await loadAppointments() }
    setSaving(false)
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (updateError) setError(`Não foi possível atualizar o agendamento: ${updateError.message}`)
    else { setNotice('Status do agendamento atualizado.'); await loadAppointments() }
  }

  async function deleteAppointment(appointment: Appointment) {
    if (!supabase || !window.confirm('Excluir este agendamento? Esta ação não pode ser desfeita.')) return
    const { error: deleteError } = await supabase.from('appointments').delete().eq('id', appointment.id)
    if (deleteError) setError(`Não foi possível excluir o agendamento: ${deleteError.message}`)
    else { setNotice('Agendamento excluído.'); await loadAppointments() }
  }

  const customerNames = new Map(customers.map((customer) => [customer.id, customer.full_name]))
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name]))
  const filteredAppointments = appointments.filter((appointment) => `${customerNames.get(appointment.customer_id ?? '') ?? ''} ${profileNames.get(appointment.assigned_profile_id ?? '') ?? ''} ${appointment.notes ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">Operação</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Agenda</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Organize visitas, instalações e manutenções com horários e responsáveis definidos.</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => void loadAppointments()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={() => { setShowForm(true); setNotice(''); setError('') }}><Plus className="h-4 w-4" /> Novo agendamento</Button></div></div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Novo compromisso</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">Agendar atendimento</h3></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2"><SelectField label="Cliente" value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })}><option value="">Sem cliente vinculado</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.full_name}</option>)}</SelectField><SelectField label="Ordem de serviço" value={form.service_order_id} onChange={(event) => setForm({ ...form, service_order_id: event.target.value })}><option value="">Sem ordem vinculada</option>{orders.map((order) => <option value={order.id} key={order.id}>{customerNames.get(order.customer_id ?? '') || 'Sem cliente'} · {order.description || 'Serviço sem descrição'}</option>)}</SelectField><SelectField label="Responsável" value={form.assigned_profile_id} onChange={(event) => setForm({ ...form, assigned_profile_id: event.target.value })}><option value="">Ainda não atribuído</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name}</option>)}</SelectField><Field label="Início" type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} required /><Field label="Fim" type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} required /><TextArea label="Observações" className="md:col-span-2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : 'Salvar agendamento'}</Button></div></form></section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Compromissos</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando agenda…' : `${appointments.length} ${appointments.length === 1 ? 'agendamento registrado' : 'agendamentos registrados'}`}</h3></div><label className="relative block sm:w-72"><span className="sr-only">Buscar agenda</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Buscar agenda" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : filteredAppointments.length === 0 ? <div className="mt-7"><EmptyState icon={<CalendarPlus className="h-5 w-5" />} title={search ? 'Nenhum resultado encontrado' : 'Agenda vazia'} description={search ? 'Tente buscar por outro cliente ou responsável.' : 'Crie o primeiro agendamento da DSS.'} /></div> : <div className="mt-7 space-y-3">{filteredAppointments.map((appointment) => <div key={appointment.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand" /><p className="font-bold text-navy">{customerNames.get(appointment.customer_id ?? '') || 'Sem cliente vinculado'}</p></div><p className="mt-1 text-xs text-slate-500">{new Date(appointment.starts_at).toLocaleString('pt-BR')} até {new Date(appointment.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{appointment.assigned_profile_id ? ` · ${profileNames.get(appointment.assigned_profile_id) || 'Responsável'}` : ''}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => void deleteAppointment(appointment)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir agendamento"><Trash2 className="h-4 w-4" /></button><select className="rounded-full border border-line bg-mist px-3 py-2 text-xs font-bold text-navy outline-none focus:border-brand" value={appointment.status} onChange={(event) => void updateStatus(appointment.id, event.target.value as AppointmentStatus)} aria-label="Status do agendamento">{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div></div>)}</div>}</section>
  </div>
}
