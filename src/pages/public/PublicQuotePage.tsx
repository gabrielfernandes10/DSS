import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, ShieldCheck, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Badge, Button } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

interface PublicQuote { id: string; status: string; valid_until: string | null; subtotal: number; discount: number; total: number; notes: string | null; created_at: string; customer: { full_name: string; email: string | null; phone: string | null } | null; company: { name: string; phone: string | null; email: string | null } | null; items: Array<{ description: string; quantity: number; unit_price: number; total: number }> }
function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
function date(value: string | null) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informada' }

export function PublicQuotePage() {
  const { token } = useParams<{ token: string }>()
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!supabase || !token) { setError('Link de orçamento inválido.'); setLoading(false); return }
    const { data, error: invokeError } = await supabase.functions.invoke('public-quote', { body: { action: 'get', token } })
    if (invokeError || data?.error) setError(data?.error === 'link_expired' ? 'Este link de orçamento expirou.' : 'Não foi possível carregar este orçamento.')
    else { setQuote(data.quote as PublicQuote); setDecision(data.decision || null) }
    setLoading(false)
  }
  useEffect(() => { void load() }, [token])

  async function respond(nextDecision: 'approved' | 'rejected') {
    if (!supabase || !token || !window.confirm(nextDecision === 'approved' ? 'Confirmar aprovação deste orçamento?' : 'Confirmar recusa deste orçamento?')) return
    setSending(true); setError('')
    const { data, error: invokeError } = await supabase.functions.invoke('public-quote', { body: { action: 'respond', token, decision: nextDecision } })
    if (invokeError || data?.error) setError(data?.error === 'already_decided' ? 'Este orçamento já recebeu uma resposta.' : 'Não foi possível registrar sua resposta.')
    else { setDecision(nextDecision); setQuote((current) => current ? { ...current, status: nextDecision } : current) }
    setSending(false)
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div>
  if (error || !quote) return <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{error || 'Orçamento não encontrado.'}</p></div>
  const companyName = quote.company?.name || 'DSS — Deni Sistemas de Segurança'

  return <div className="mx-auto max-w-4xl pb-12"><div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft"><header className="bg-navy px-7 py-9 text-white sm:px-12"><div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-cyan"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-extrabold uppercase tracking-[0.2em]">DSS</span></div><h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.05em]">Sua proposta comercial</h1><p className="mt-3 text-sm text-white/60">Uma solução de segurança preparada para você.</p></div><Badge tone="navy">{decision === 'approved' ? 'Aprovado' : decision === 'rejected' ? 'Recusado' : 'Em análise'}</Badge></div></header><div className="p-7 sm:p-12"><div className="grid gap-7 border-b border-line pb-8 sm:grid-cols-2"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">Cliente</p><p className="mt-3 font-display text-xl font-extrabold text-navy">{quote.customer?.full_name || 'Cliente'}</p><p className="mt-2 text-sm text-slate-500">{quote.customer?.email || ''}{quote.customer?.phone ? ` · ${quote.customer.phone}` : ''}</p></div><div className="sm:text-right"><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">Validade</p><p className="mt-3 font-display text-xl font-extrabold text-navy">{date(quote.valid_until)}</p><p className="mt-2 text-sm text-slate-500">Emitido em {new Date(quote.created_at).toLocaleDateString('pt-BR')}</p></div></div><div className="mt-9 overflow-x-auto"><table className="w-full min-w-[540px] border-collapse text-left"><thead><tr className="border-b-2 border-cyan text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand"><th className="pb-3">Descrição</th><th className="w-20 pb-3 text-center">Qtd.</th><th className="w-32 pb-3 text-right">Unitário</th><th className="w-32 pb-3 text-right">Total</th></tr></thead><tbody>{quote.items.map((item, index) => <tr key={`${item.description}-${index}`} className="border-b border-line text-sm"><td className="py-4 font-semibold text-navy">{item.description}</td><td className="py-4 text-center text-slate-600">{Number(item.quantity)}</td><td className="py-4 text-right text-slate-600">{currency(Number(item.unit_price))}</td><td className="py-4 text-right font-bold text-navy">{currency(Number(item.total))}</td></tr>)}</tbody></table></div><div className="mt-8 flex justify-end"><div className="w-full max-w-sm space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>Subtotal</span><strong className="text-navy">{currency(Number(quote.subtotal))}</strong></div><div className="flex justify-between text-slate-500"><span>Desconto</span><strong className="text-navy">{currency(Number(quote.discount))}</strong></div><div className="flex justify-between border-t-2 border-navy pt-4 text-lg"><span className="font-extrabold text-navy">Total</span><strong className="font-display text-2xl font-extrabold text-brand">{currency(Number(quote.total))}</strong></div></div></div>{quote.notes && <div className="mt-9 rounded-2xl bg-mist p-5"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Observações</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{quote.notes}</p></div>}<div className="mt-10 rounded-3xl border border-cyan/30 bg-cyan/5 p-6 text-center"><p className="font-display text-xl font-extrabold text-navy">O que você achou da proposta?</p>{decision ? <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-brand"><CheckCircle2 className="h-5 w-5" /> Sua resposta foi registrada como {decision === 'approved' ? 'aprovada' : 'recusada'}.</div> : <div className="mt-5 flex flex-wrap justify-center gap-3"><Button onClick={() => void respond('approved')} disabled={sending}><CheckCircle2 className="h-4 w-4" /> Aprovar orçamento</Button><Button variant="secondary" onClick={() => void respond('rejected')} disabled={sending}><XCircle className="h-4 w-4" /> Recusar</Button></div>}</div><footer className="mt-10 border-t border-line pt-6 text-center text-xs leading-5 text-slate-500">{companyName}<br />{quote.company?.phone || ''}{quote.company?.email ? ` · ${quote.company.email}` : ''}</footer></div></div></div>
}
