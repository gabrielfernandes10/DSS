import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, ClipboardCheck, FileImage, LoaderCircle, Trash2, Upload, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

interface Order { id: string; company_id: string; customer_id: string | null; status: string; priority: string; description: string | null; scheduled_for: string | null }
interface ChecklistItem { id: string; label: string; position: number; completed: boolean; completed_at: string | null }
interface Evidence { id: string; storage_path: string; file_name: string; mime_type: string | null; byte_size: number | null; created_at: string }

const defaultChecklist = ['Material separado', 'Local preparado e protegido', 'Instalação ou conserto realizado', 'Testes técnicos concluídos', 'Cliente orientado sobre o uso', 'Serviço finalizado com evidências']

function formatBytes(value: number | null) {
  if (!value) return ''
  return value > 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`
}

export function ServiceOrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadDetails() {
    if (!supabase || !id) { setError('Ordem de serviço não encontrada.'); setLoading(false); return }
    setLoading(true); setError('')
    const { data: orderData, error: orderError } = await supabase.from('service_orders').select('id, company_id, customer_id, status, priority, description, scheduled_for').eq('id', id).single()
    if (orderError || !orderData) { setError('Não foi possível carregar a ordem de serviço.'); setLoading(false); return }
    let checklistResult = await supabase.from('service_order_checklist_items').select('id, label, position, completed, completed_at').eq('service_order_id', id).order('position')
    if (!checklistResult.error && !checklistResult.data?.length) {
      const created = await supabase.from('service_order_checklist_items').insert(defaultChecklist.map((label, position) => ({ company_id: orderData.company_id, service_order_id: id, label, position }))).select('id, label, position, completed, completed_at')
      checklistResult = created
    }
    const evidenceResult = await supabase.from('service_order_evidence').select('id, storage_path, file_name, mime_type, byte_size, created_at').eq('service_order_id', id).order('created_at', { ascending: false })
    if (checklistResult.error || evidenceResult.error) setError(`Não foi possível carregar os detalhes: ${(checklistResult.error || evidenceResult.error)?.message}`)
    else { setOrder(orderData as Order); setItems((checklistResult.data ?? []) as ChecklistItem[]); setEvidence((evidenceResult.data ?? []) as Evidence[]) }
    setLoading(false)
  }

  useEffect(() => { void loadDetails() }, [id])

  const completed = useMemo(() => items.filter((item) => item.completed).length, [items])
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0

  async function toggleItem(item: ChecklistItem) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('service_order_checklist_items').update({ completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : null }).eq('id', item.id)
    if (updateError) setError(`Não foi possível atualizar o checklist: ${updateError.message}`)
    else { setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : null } : currentItem)); setNotice(!item.completed ? 'Etapa concluída.' : 'Etapa reaberta.') }
  }

  async function uploadEvidence(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !supabase || !order || !id) return
    if (file.size > 10 * 1024 * 1024) { setError('O arquivo deve ter no máximo 10 MB.'); return }
    setUploading(true); setError(''); setNotice('')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100)
    const path = `${order.company_id}/${id}/${crypto.randomUUID()}-${safeName}`
    const uploadResult = await supabase.storage.from('service-order-evidence').upload(path, file, { upsert: false })
    if (uploadResult.error) { setError(`Não foi possível enviar o arquivo: ${uploadResult.error.message}`); setUploading(false); return }
    const recordResult = await supabase.from('service_order_evidence').insert({ company_id: order.company_id, service_order_id: id, storage_path: path, file_name: file.name, mime_type: file.type || null, byte_size: file.size }).select('id, storage_path, file_name, mime_type, byte_size, created_at').single()
    if (recordResult.error) { await supabase.storage.from('service-order-evidence').remove([path]); setError(`Não foi possível registrar a evidência: ${recordResult.error.message}`) }
    else { setEvidence((current) => [recordResult.data as Evidence, ...current]); setNotice('Evidência adicionada à ordem.') }
    event.target.value = ''
    setUploading(false)
  }

  async function removeEvidence(item: Evidence) {
    if (!supabase || !window.confirm(`Excluir a evidência "${item.file_name}"?`)) return
    const storageResult = await supabase.storage.from('service-order-evidence').remove([item.storage_path])
    const recordResult = await supabase.from('service_order_evidence').delete().eq('id', item.id)
    if (storageResult.error || recordResult.error) setError(`Não foi possível excluir a evidência: ${(storageResult.error || recordResult.error)?.message}`)
    else { setEvidence((current) => current.filter((currentItem) => currentItem.id !== item.id)); setNotice('Evidência excluída.') }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div>
  if (!order) return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error || 'Ordem não encontrada.'}</div>

  return <div className="mx-auto max-w-5xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Link to="/painel/ordens" className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar às ordens</Link><div className="mt-5"><Badge tone="blue">Execução operacional</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Checklist da ordem</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{order.description || 'Acompanhe as etapas e registre evidências do serviço.'}</p></div></div><Link to={`/painel/ordens`} className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-navy hover:border-brand hover:text-brand">Editar dados da ordem</Link></div>{notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}{error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}<div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Checklist técnico</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">{completed} de {items.length} etapas concluídas</h3></div><div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-cyan/20 text-sm font-extrabold text-brand">{progress}%</div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${progress}%` }} /></div>{items.length === 0 ? <div className="mt-7"><EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="Checklist vazio" description="Não foi possível criar as etapas padrão desta ordem." /></div> : <div className="mt-7 space-y-3">{items.map((item) => <button type="button" key={item.id} onClick={() => void toggleItem(item)} className="flex w-full items-center gap-4 rounded-2xl border border-line p-4 text-left transition hover:border-cyan/50 hover:bg-mist"><span className={item.completed ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan text-navy' : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line text-transparent'}><Check className="h-4 w-4" /></span><span className={item.completed ? 'text-sm font-bold text-slate-400 line-through' : 'text-sm font-bold text-navy'}>{item.label}</span>{item.completed && <CheckCircle2 className="ml-auto h-5 w-5 text-cyan" />}</button>)}</div>}</section><section className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Evidências</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">Fotos e comprovantes</h3></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan px-4 py-2.5 text-xs font-extrabold text-navy hover:bg-[#31c8d8]"><Upload className="h-4 w-4" />{uploading ? 'Enviando…' : 'Adicionar arquivo'}<input type="file" className="sr-only" accept="image/*,.pdf" onChange={(event) => void uploadEvidence(event)} disabled={uploading} /></label></div><p className="mt-3 text-sm leading-6 text-slate-500">Envie imagens ou PDF de até 10 MB para registrar a conclusão.</p>{evidence.length === 0 ? <div className="mt-7"><EmptyState icon={<FileImage className="h-5 w-5" />} title="Nenhuma evidência" description="Adicione fotos do serviço concluído ou comprovantes técnicos." /></div> : <div className="mt-7 space-y-3">{evidence.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-line p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand"><FileImage className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-navy">{item.file_name}</p><p className="mt-1 text-xs text-slate-500">{formatBytes(item.byte_size)} · {new Date(item.created_at).toLocaleDateString('pt-BR')}</p></div><button type="button" onClick={() => void removeEvidence(item)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${item.file_name}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}</section></div></div>
}
