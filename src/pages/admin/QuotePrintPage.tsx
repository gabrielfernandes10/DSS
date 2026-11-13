import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, MessageCircle, Printer } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

interface Quote { id: string; company_id: string; customer_id: string | null; status: string; valid_until: string | null; subtotal: number; discount: number; total: number; notes: string | null; created_at: string }
interface Customer { full_name: string; email: string | null; phone: string | null }
interface Company { name: string; email: string | null; phone: string | null }
interface Item { id: string; description: string; quantity: number; unit_price: number; total: number }

function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
function date(value: string | null) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informada' }

export function QuotePrintPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    async function loadQuote() {
      if (!supabase || !id) { setError('Orçamento não encontrado.'); setLoading(false); return }
      const { data: quoteData, error: quoteError } = await supabase.from('quotes').select('id, company_id, customer_id, status, valid_until, subtotal, discount, total, notes, created_at').eq('id', id).single()
      if (quoteError || !quoteData) { setError('Não foi possível carregar este orçamento.'); setLoading(false); return }
      const [customerResult, companyResult, itemsResult] = await Promise.all([
        quoteData.customer_id ? supabase.from('customers').select('full_name, email, phone').eq('id', quoteData.customer_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from('companies').select('name, email, phone').eq('id', quoteData.company_id).maybeSingle(),
        supabase.from('quote_items').select('id, description, quantity, unit_price, total').eq('quote_id', id).order('created_at'),
      ])
      const firstError = [customerResult, companyResult, itemsResult].find((result) => result.error)
      if (firstError?.error) setError('Não foi possível carregar os dados completos do orçamento.')
      else { setQuote(quoteData as Quote); setCustomer(customerResult.data as Customer | null); setCompany(companyResult.data as Company | null); setItems((itemsResult.data ?? []) as Item[]) }
      setLoading(false)
    }
    void loadQuote()
  }, [id])

  async function sendByEmail() {
    if (!supabase || !id) return
    setSending(true); setNotice(''); setError('')
    const { data, error: invokeError } = await supabase.functions.invoke('send-quote-email', { body: { quote_id: id } })
    if (invokeError || data?.error) setError(data?.error === 'customer_email_missing' ? 'O cliente não possui e-mail cadastrado.' : 'Não foi possível enviar o orçamento. Verifique o Resend no Supabase.')
    else setNotice('Orçamento enviado por e-mail com sucesso.')
    setSending(false)
  }

  function shareWhatsApp() {
    if (!quote) return
    const message = `Olá${customer?.full_name ? `, ${customer.full_name}` : ''}! Segue o orçamento da ${company?.name || 'DSS — Deni Sistemas de Segurança'}. Total: ${currency(Number(quote.total))}. Validade: ${date(quote.valid_until)}.`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div>
  if (error || !quote) return <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{error || 'Orçamento não encontrado.'}</p><Button variant="secondary" className="mt-6" onClick={() => navigate('/painel/orcamentos')}>Voltar aos orçamentos</Button></div>

  return <div className="quote-print-page mx-auto max-w-4xl pb-10"><div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3"><Link to="/painel/orcamentos" className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar aos orçamentos</Link><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Salvar como PDF</Button><Button variant="secondary" onClick={shareWhatsApp}><MessageCircle className="h-4 w-4" /> WhatsApp</Button><Button onClick={() => void sendByEmail()} disabled={sending || !customer?.email}>{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{sending ? 'Enviando…' : 'Enviar por e-mail'}</Button></div></div>{notice && <div className="no-print mb-5 flex items-center gap-2 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status"><CheckCircle2 className="h-4 w-4" />{notice}</div>}<article className="quote-paper overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft"><header className="bg-navy px-8 py-9 text-white sm:px-12"><div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-start"><div><p className="text-xs font-extrabold uppercase tracking-[0.24em] text-cyan">DSS — Deni Sistemas de Segurança</p><h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">Orçamento</h1><p className="mt-3 text-sm text-white/60">Proposta comercial preparada para você.</p></div><div className="sm:text-right"><Badge tone="navy">{quote.status === 'draft' ? 'Rascunho' : 'Proposta'}</Badge><p className="mt-4 text-xs text-white/55">Emitido em {new Date(quote.created_at).toLocaleDateString('pt-BR')}</p></div></div></header><div className="p-8 sm:p-12"><div className="grid gap-8 border-b border-line pb-8 sm:grid-cols-2"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">Cliente</p><p className="mt-3 font-display text-xl font-extrabold text-navy">{customer?.full_name || 'Cliente não informado'}</p><p className="mt-2 text-sm text-slate-500">{customer?.email || 'E-mail não informado'}{customer?.phone ? ` · ${customer.phone}` : ''}</p></div><div className="sm:text-right"><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">Validade da proposta</p><p className="mt-3 font-display text-xl font-extrabold text-navy">{date(quote.valid_until)}</p><p className="mt-2 text-sm text-slate-500">{company?.name || 'DSS — Deni Sistemas de Segurança'}</p></div></div><div className="mt-9"><table className="w-full border-collapse text-left"><thead><tr className="border-b-2 border-cyan text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand"><th className="pb-3">Descrição</th><th className="w-20 pb-3 text-center">Qtd.</th><th className="w-32 pb-3 text-right">Unitário</th><th className="w-32 pb-3 text-right">Total</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-line text-sm"><td className="py-4 font-semibold text-navy">{item.description}</td><td className="py-4 text-center text-slate-600">{Number(item.quantity)}</td><td className="py-4 text-right text-slate-600">{currency(Number(item.unit_price))}</td><td className="py-4 text-right font-bold text-navy">{currency(Number(item.total))}</td></tr>)}</tbody></table></div><div className="mt-8 flex justify-end"><div className="w-full max-w-sm space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>Subtotal</span><strong className="text-navy">{currency(Number(quote.subtotal))}</strong></div><div className="flex justify-between text-slate-500"><span>Desconto</span><strong className="text-navy">{currency(Number(quote.discount))}</strong></div><div className="flex justify-between border-t-2 border-navy pt-4 text-lg"><span className="font-extrabold text-navy">Total</span><strong className="font-display text-2xl font-extrabold text-brand">{currency(Number(quote.total))}</strong></div></div></div>{quote.notes && <div className="mt-10 rounded-2xl bg-mist p-5"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Observações</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{quote.notes}</p></div>}<footer className="mt-12 border-t border-line pt-6 text-center text-xs leading-5 text-slate-500">Obrigado por considerar a DSS. Segurança e automação para residências e condomínios em Porto Alegre.<br />{company?.phone || ''}{company?.email ? ` · ${company.email}` : ''}</footer></div></article></div>
}
