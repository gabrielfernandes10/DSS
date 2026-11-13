import { FormEvent, useEffect, useState } from 'react'
import { Building2, LoaderCircle, Plus, RefreshCw, Search, UserRound, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, SelectField, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

interface Customer {
  id: string
  full_name: string
  customer_type: 'individual' | 'condominium'
  email: string | null
  phone: string | null
  created_at: string
}

interface CustomerForm {
  full_name: string
  customer_type: 'individual' | 'condominium'
  email: string
  phone: string
  notes: string
}

const emptyForm: CustomerForm = { full_name: '', customer_type: 'individual', email: '', phone: '', notes: '' }

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadCustomers() {
    if (!supabase) { setError('A integração com o Supabase não está disponível.'); setLoading(false); return }
    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase.from('customers').select('id, full_name, customer_type, email, phone, created_at').order('created_at', { ascending: false })
    if (queryError) setError(`Não foi possível carregar os clientes: ${queryError.message}`)
    else setCustomers((data ?? []) as Customer[])
    setLoading(false)
  }

  useEffect(() => { void loadCustomers() }, [])

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
    if (profileError || !profile?.company_id) { setError('Finalize o primeiro acesso da empresa antes de cadastrar clientes.'); setSaving(false); return }
    const { error: insertError } = await supabase.from('customers').insert({ company_id: profile.company_id, full_name: form.full_name.trim(), customer_type: form.customer_type, email: form.email.trim() || null, phone: form.phone.trim() || null, notes: form.notes.trim() || null })
    if (insertError) { setError(`Não foi possível salvar o cliente: ${insertError.message}`); setSaving(false); return }
    setForm(emptyForm)
    setShowForm(false)
    setNotice('Cliente cadastrado com sucesso.')
    setSaving(false)
    await loadCustomers()
  }

  const filteredCustomers = customers.filter((customer) => `${customer.full_name} ${customer.email ?? ''} ${customer.phone ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">Relacionamento</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Clientes</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Organize pessoas e condomínios atendidos pela DSS com seus contatos e histórico.</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => void loadCustomers()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={() => { setShowForm(true); setNotice(''); setError('') }}><Plus className="h-4 w-4" /> Novo cliente</Button></div></div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Novo cadastro</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">Adicionar cliente</h3></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2"><Field label="Nome completo ou nome do condomínio" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required /><SelectField label="Tipo" value={form.customer_type} onChange={(event) => setForm({ ...form, customer_type: event.target.value as CustomerForm['customer_type'] })}><option value="individual">Pessoa / residência</option><option value="condominium">Condomínio</option></SelectField><Field label="E-mail" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><Field label="Telefone / WhatsApp" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><TextArea label="Observações" className="md:col-span-2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : 'Salvar cliente'}</Button></div></form></section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Base de relacionamento</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando clientes…' : `${customers.length} ${customers.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`}</h3></div><label className="relative block sm:w-72"><span className="sr-only">Buscar clientes</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : filteredCustomers.length === 0 ? <div className="mt-7"><EmptyState icon={search ? <Search className="h-5 w-5" /> : <UserRound className="h-5 w-5" />} title={search ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'} description={search ? 'Tente buscar por outro nome, e-mail ou telefone.' : 'Cadastre o primeiro cliente da DSS para começar a organizar a operação.'} /></div> : <div className="mt-7 grid gap-3">{filteredCustomers.map((customer) => <div key={customer.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-brand">{customer.customer_type === 'condominium' ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div><div><p className="font-bold text-navy">{customer.full_name}</p><p className="mt-1 text-xs text-slate-500">{customer.email || customer.phone || 'Sem contato informado'}</p></div></div><span className="self-start rounded-full bg-cyan/10 px-3 py-1.5 text-[11px] font-bold text-brand sm:self-auto">{customer.customer_type === 'condominium' ? 'Condomínio' : 'Pessoa / residência'}</span></div>)}</div>}</section>
  </div>
}
