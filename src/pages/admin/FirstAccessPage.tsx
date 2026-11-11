import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../components/brand/BrandMark'
import { Badge, Button, Field } from '../../components/ui'
import { supabase, supabaseConfigured } from '../../lib/supabase/client'

export function FirstAccessPage() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) { setCheckingSession(false); return }
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) { setHasSession(Boolean(data.session)); setCheckingSession(false) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setHasSession(Boolean(session)); setCheckingSession(false) }
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (password !== confirmation) { setError('As senhas não conferem.'); return }
    if (!supabase) { setError('A integração com o Supabase não está disponível neste ambiente.'); return }
    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (updateError) { setError('Não foi possível definir a senha. Solicite um novo convite e tente novamente.'); return }
    setSuccess(true)
    window.setTimeout(() => navigate('/painel'), 700)
  }

  if (!supabaseConfigured) return <StatusCard title="Supabase ainda não configurado." description="A página de primeiro acesso será liberada quando as variáveis do projeto estiverem disponíveis." />
  if (checkingSession) return <StatusCard title="Validando seu convite…" description="Aguarde enquanto confirmamos a sessão segura." />
  if (!hasSession) return <StatusCard title="Convite não encontrado." description="Abra novamente o link recebido por e-mail. Se ele expirou, envie um novo convite pelo Supabase Auth." action="Voltar ao login" />

  return <div className="grid min-h-screen bg-mist lg:grid-cols-[.9fr_1.1fr]"><section className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-circuit-grid bg-[length:38px_38px] opacity-30" /><div className="relative"><BrandMark dark /><div className="mt-24 max-w-md"><Badge tone="navy"><ShieldCheck className="h-3.5 w-3.5" /> Convite confirmado</Badge><h1 className="mt-6 font-display text-5xl font-extrabold leading-tight tracking-[-0.05em]">Seu acesso DSS começa aqui.</h1><p className="mt-6 text-base leading-7 text-white/60">Defina uma senha segura para entrar no painel administrativo da empresa.</p></div></div><p className="relative text-xs text-white/35">DSS — Deni Sistemas de Segurança</p></section><main className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><BrandMark /></div><Badge tone="blue"><KeyRound className="h-3.5 w-3.5" /> Primeiro acesso</Badge><h2 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.05em] text-navy">Defina sua senha.</h2><p className="mt-4 text-sm leading-6 text-slate-600">Depois disso, você poderá entrar no painel com seu e-mail.</p>{success ? <div className="mt-9 rounded-[2rem] border border-cyan/30 bg-cyan/10 p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-brand" /><h3 className="mt-5 font-display text-2xl font-extrabold text-navy">Senha definida</h3><p className="mt-3 text-sm leading-6 text-slate-600">Redirecionando para o painel DSS…</p></div> : <form onSubmit={handleSubmit} className="mt-9 rounded-[2rem] border border-line bg-white p-6 shadow-soft sm:p-8"><Field label="Nova senha" type="password" placeholder="Mínimo de 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} required /><Field label="Confirme a senha" type="password" placeholder="Digite novamente" className="mt-5" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />{error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}<Button type="submit" className="mt-7 w-full" disabled={submitting}>{submitting ? 'Salvando…' : 'Definir senha'} {!submitting && <ArrowRight className="h-4 w-4" />}</Button></form>}<p className="mt-6 text-center text-sm text-slate-500"><Link to="/" className="font-bold text-brand hover:underline">Voltar ao website</Link></p></div></main></div>
}

function StatusCard({ title, description, action }: { title: string; description: string; action?: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-mist px-5 py-10"><div className="w-full max-w-lg rounded-[2rem] border border-line bg-white p-8 text-center shadow-soft sm:p-10"><div className="flex justify-center"><BrandMark /></div><div className="mx-auto mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-brand"><KeyRound className="h-6 w-6" /></div><Badge tone="blue" className="mt-6">Primeiro acesso</Badge><h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy">{title}</h1><p className="mt-4 text-sm leading-6 text-slate-600">{description}</p><Link to={action ? '/painel/login' : '/'} className="mt-7 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-brand">{action ?? 'Voltar ao website'} <ArrowRight className="h-4 w-4" /></Link></div></div>
}
