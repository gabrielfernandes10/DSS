import { FormEvent, useEffect, useState } from 'react'
import { Check, LoaderCircle, Plus, RefreshCw, Settings2, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

interface ServiceType { id: string; name: string; description: string | null; active: boolean; created_at: string }
interface ServiceForm { name: string; description: string }

const emptyForm: ServiceForm = { name: '', description: '' }
const dssServices = [
  { name: 'Cercas elétricas', description: 'Instalação, manutenção e conserto de cercas elétricas.' },
  { name: 'Motores de portão', description: 'Instalação, manutenção e conserto de motores de portões.' },
  { name: 'Controles de portão', description: 'Cadastro, configuração e substituição de controles de portão.' },
  { name: 'Câmeras de segurança', description: 'Instalação e manutenção de câmeras com acesso pelo celular.' },
  { name: 'Interfones', description: 'Instalação e manutenção de interfones para residências e condomínios.' },
  { name: 'Fechaduras eletrônicas', description: 'Instalação e manutenção de fechaduras eletrônicas.' },
]

export function ServiceTypesPage() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadServices() {
    if (!supabase) { setError('A integração com o Supabase não está disponível.'); setLoading(false); return }
    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase.from('service_types').select('id, name, description, active, created_at').order('name')
    if (queryError) setError(`Não foi possível carregar o catálogo: ${queryError.message}`)
    else setServices((data ?? []) as ServiceType[])
    setLoading(false)
  }

  useEffect(() => { void loadServices() }, [])

  async function companyId() {
    if (!supabase) return null
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) return null
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', userId).single()
    return profile?.company_id ?? null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true); setError(''); setNotice('')
    const id = await companyId()
    if (!id) { setError('Finalize o primeiro acesso da empresa antes de cadastrar serviços.'); setSaving(false); return }
    const { error: insertError } = await supabase.from('service_types').insert({ company_id: id, name: form.name.trim(), description: form.description.trim() || null, active: true })
    if (insertError) setError(`Não foi possível salvar o serviço: ${insertError.message}`)
    else { setForm(emptyForm); setShowForm(false); setNotice('Serviço cadastrado com sucesso.'); await loadServices() }
    setSaving(false)
  }

  async function seedCatalog() {
    if (!supabase) return
    setSeeding(true); setError(''); setNotice('')
    const id = await companyId()
    if (!id) { setError('Finalize o primeiro acesso da empresa antes de cadastrar serviços.'); setSeeding(false); return }
    const existingNames = new Set(services.map((service) => service.name.toLowerCase()))
    const pending = dssServices.filter((service) => !existingNames.has(service.name.toLowerCase())).map((service) => ({ ...service, company_id: id, active: true }))
    if (!pending.length) { setNotice('O catálogo da DSS já está completo.'); setSeeding(false); return }
    const { error: insertError } = await supabase.from('service_types').insert(pending)
    if (insertError) setError(`Não foi possível criar o catálogo: ${insertError.message}`)
    else { setNotice(`${pending.length} serviços da DSS foram adicionados ao catálogo.`); await loadServices() }
    setSeeding(false)
  }

  async function toggleActive(service: ServiceType) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('service_types').update({ active: !service.active }).eq('id', service.id)
    if (updateError) setError(`Não foi possível atualizar o serviço: ${updateError.message}`)
    else await loadServices()
  }

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">Configuração</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Catálogo de serviços</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Cadastre os serviços que a DSS oferece para usá-los em solicitações, orçamentos e ordens de serviço.</p></div><div className="flex gap-3"><Button variant="secondary" onClick={() => void loadServices()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={() => { setShowForm(true); setNotice(''); setError('') }}><Plus className="h-4 w-4" /> Novo serviço</Button></div></div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Novo item</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">Adicionar serviço</h3></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5"><Field label="Nome do serviço" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><TextArea label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : 'Salvar serviço'}</Button></div></form></section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Serviços da DSS</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando catálogo…' : `${services.length} ${services.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}`}</h3></div>{!loading && services.length === 0 && <Button variant="secondary" onClick={() => void seedCatalog()} disabled={seeding}>{seeding && <LoaderCircle className="h-4 w-4 animate-spin" />}{seeding ? 'Criando catálogo…' : 'Adicionar catálogo DSS'}</Button>}</div>{loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : services.length === 0 ? <div className="mt-7"><EmptyState icon={<Settings2 className="h-5 w-5" />} title="Catálogo vazio" description="Adicione os serviços reais da DSS para disponibilizá-los nas solicitações." /></div> : <div className="mt-7 grid gap-3">{services.map((service) => <div key={service.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-bold text-navy">{service.name}</p><p className="mt-1 text-sm leading-6 text-slate-500">{service.description || 'Sem descrição cadastrada.'}</p></div><button type="button" onClick={() => void toggleActive(service)} className={service.active ? 'inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-cyan/10 px-3 py-1.5 text-xs font-bold text-brand sm:self-auto' : 'inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-mist px-3 py-1.5 text-xs font-bold text-slate-500 sm:self-auto'}><Check className="h-3.5 w-3.5" /> {service.active ? 'Ativo' : 'Inativo'}</button></div>)}</div>}</section>
  </div>
}
