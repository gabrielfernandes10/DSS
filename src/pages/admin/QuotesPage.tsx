import { FormEvent, useEffect, useMemo, useState } from 'react'
import { FileText, LoaderCircle, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, SelectField, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
interface Customer { id: string; full_name: string }
interface Request { id: string; subject: string | null }
interface Quote { id: string; customer_id: string | null; request_id: string | null; status: QuoteStatus; valid_until: string | null; subtotal: number; discount: number; total: number; created_at: string }
interface QuoteItem { description: string; quantity: number; unit_price: number }
interface QuoteForm { customer_id: string; request_id: string; valid_until: string; discount: number; notes: string }

const emptyForm: QuoteForm = { customer_id: '', request_id: '', valid_until: '', discount: 0, notes: '' }
const statusLabels: Record<QuoteStatus, string> = { draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', rejected: 'Recusado', expired: 'Expirado' }
const emptyItem: QuoteItem = { description: '', quantity: 1, unit_price: 0 }

function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [form, setForm] = useState<QuoteForm>(emptyForm)
  const [items, setItems] = useState<QuoteItem[]>([{ ...emptyItem }])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadQuotes() {
    if (!supabase) { setError('A integração com o Supabase não está disponível.'); setLoading(false); return }
    setLoading(true); setError('')
    const [quotesResult, customersResult, requestsResult] = await Promise.all([
      supabase.from('quotes').select('id, customer_id, request_id, status, valid_until, subtotal, discount, total, created_at').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name').order('full_name'),
      supabase.from('service_requests').select('id, subject').order('created_at', { ascending: false }),
    ])
    const firstError = [quotesResult, customersResult, requestsResult].find((result) => result.error)
    if (firstError?.error) setError(`Não foi possível carregar os orçamentos: ${firstError.error.message}`)
    else { setQuotes((quotesResult.data ?? []) as Quote[]); setCustomers((customersResult.data ?? []) as Customer[]); setRequests((requestsResult.data ?? []) as Request[]) }
    setLoading(false)
  }

  useEffect(() => { void loadQuotes() }, [])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_price) || 0), 0), [items])
  const total = Math.max(0, subtotal - (Number(form.discount) || 0))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const validItems = items.filter((item) => item.description.trim() && Number(item.quantity) > 0 && Number(item.unit_price) >= 0)
    if (!validItems.length) { setError('Adicione pelo menos um item válido ao orçamento.'); return }
    if ((Number(form.discount) || 0) > subtotal) { setError('O desconto não pode ser maior que o subtotal.'); return }
    setSaving(true); setError(''); setNotice('')
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) { setError('Sua sessão expirou. Faça login novamente.'); setSaving(false); return }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('id', userId).single()
    if (profileError || !profile?.company_id) { setError('Finalize o primeiro acesso da empresa antes de cadastrar orçamentos.'); setSaving(false); return }
    const { data: quote, error: quoteError } = await supabase.from('quotes').insert({ company_id: profile.company_id, customer_id: form.customer_id || null, request_id: form.request_id || null, valid_until: form.valid_until || null, subtotal, discount: Number(form.discount) || 0, total, notes: form.notes.trim() || null, status: 'draft' }).select('id').single()
    if (quoteError || !quote) { setError(`Não foi possível salvar o orçamento: ${quoteError?.message ?? 'resposta inválida'}`); setSaving(false); return }
    const { error: itemsError } = await supabase.from('quote_items').insert(validItems.map((item) => ({ company_id: profile.company_id, quote_id: quote.id, description: item.description.trim(), quantity: Number(item.quantity), unit_price: Number(item.unit_price), total: Number(item.quantity) * Number(item.unit_price) })))
    if (itemsError) { await supabase.from('quotes').delete().eq('id', quote.id); setError(`Não foi possível salvar os itens: ${itemsError.message}`); setSaving(false); return }
    setForm(emptyForm); setItems([{ ...emptyItem }]); setShowForm(false); setNotice('Orçamento criado como rascunho.'); setSaving(false); await loadQuotes()
  }

  async function updateStatus(id: string, status: QuoteStatus) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('quotes').update({ status }).eq('id', id)
    if (updateError) setError(`Não foi possível atualizar o orçamento: ${updateError.message}`)
    else { setNotice('Status do orçamento atualizado.'); await loadQuotes() }
  }

  const customerNames = new Map(customers.map((customer) => [customer.id, customer.full_name]))
  const filteredQuotes = quotes.filter((quote) => `${customerNames.get(quote.customer_id ?? '') ?? ''} ${quote.total}`.toLowerCase().includes(search.toLowerCase()))

    return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">Comercial</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Orçamentos</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Estruture propostas com itens, valores e validade, mantendo o contexto da solicitação original.</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => void loadQuotes()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={() => { setShowForm(true); setNotice(''); setError('') }}><Plus className="h-4 w-4" /> Novo orçamento</Button></div></div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Nova proposta</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">Criar orçamento</h3></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2"><SelectField label="Cliente" value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })}><option value="">Sem cliente vinculado</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.full_name}</option>)}</SelectField><SelectField label="Solicitação de origem" value={form.request_id} onChange={(event) => setForm({ ...form, request_id: event.target.value })}><option value="">Sem solicitação vinculada</option>{requests.map((request) => <option value={request.id} key={request.id}>{request.subject || 'Solicitação sem assunto'}</option>)}</SelectField><Field label="Validade" type="date" value={form.valid_until} onChange={(event) => setForm({ ...form, valid_until: event.target.value })} /><Field label="Desconto (R$)" type="number" min="0" step="0.01" value={form.discount} onChange={(event) => setForm({ ...form, discount: Number(event.target.value) })} /><div className="rounded-2xl border border-line bg-mist p-4 md:col-span-2"><div className="flex items-center justify-between"><p className="text-sm font-bold text-navy">Itens do orçamento</p><Button type="button" variant="ghost" onClick={() => setItems([...items, { ...emptyItem }])}><Plus className="h-4 w-4" /> Adicionar item</Button></div><div className="mt-4 space-y-3">{items.map((item, index) => <div className="grid gap-3 rounded-2xl bg-white p-3 sm:grid-cols-[1fr_110px_130px_auto]" key={`${index}-${item.description}`}><Field label="Descrição" value={item.description} onChange={(event) => setItems(items.map((current, currentIndex) => currentIndex === index ? { ...current, description: event.target.value } : current))} required /><Field label="Qtd." type="number" min="1" step="0.01" value={item.quantity} onChange={(event) => setItems(items.map((current, currentIndex) => currentIndex === index ? { ...current, quantity: Number(event.target.value) } : current))} required /><Field label="Valor unitário" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => setItems(items.map((current, currentIndex) => currentIndex === index ? { ...current, unit_price: Number(event.target.value) } : current))} required /><button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, currentIndex) => currentIndex !== index))} className="mt-7 rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="Remover item"><Trash2 className="h-4 w-4" /></button></div>)}</div><div className="mt-5 flex justify-end gap-6 text-sm"><span className="text-slate-500">Subtotal <strong className="ml-2 text-navy">{currency(subtotal)}</strong></span><span className="font-bold text-brand">Total <strong className="ml-2 text-lg text-navy">{currency(total)}</strong></span></div></div><TextArea label="Observações" className="md:col-span-2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : 'Salvar rascunho'}</Button></div></form></section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Propostas comerciais</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando orçamentos…' : `${quotes.length} ${quotes.length === 1 ? 'orçamento cadastrado' : 'orçamentos cadastrados'}`}</h3></div><label className="relative block sm:w-72"><span className="sr-only">Buscar orçamentos</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Buscar por cliente" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : filteredQuotes.length === 0 ? <div className="mt-7"><EmptyState icon={<FileText className="h-5 w-5" />} title={search ? 'Nenhum resultado encontrado' : 'Nenhum orçamento cadastrado'} description={search ? 'Tente buscar por outro cliente ou valor.' : 'Crie o primeiro orçamento comercial da DSS.'} /></div> : <div className="mt-7 space-y-3">{filteredQuotes.map((quote) => <div key={quote.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-bold text-navy">{customerNames.get(quote.customer_id ?? '') || 'Sem cliente vinculado'}</p><p className="mt-1 text-xs text-slate-500">Criado em {new Date(quote.created_at).toLocaleDateString('pt-BR')}{quote.valid_until ? ` · válido até ${new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</p></div><div className="flex flex-wrap items-center gap-3"><strong className="text-navy">{currency(Number(quote.total))}</strong><select className="rounded-full border border-line bg-mist px-3 py-2 text-xs font-bold text-navy outline-none focus:border-brand" value={quote.status} onChange={(event) => void updateStatus(quote.id, event.target.value as QuoteStatus)} aria-label="Status do orçamento">{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div></div>)}</div>}</section>
  </div>
}
