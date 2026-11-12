import { FormEvent, useState } from 'react'
import { ArrowRight, Chrome, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../components/brand/BrandMark'
import { Badge, Button, Field } from '../../components/ui'
import { supabase, supabaseConfigured } from '../../lib/supabase/client'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    if (!supabaseConfigured || !supabase) { setNotice('Configure o Supabase para habilitar o acesso real ao painel.'); return }
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSubmitting(false)
    if (error) {
      setNotice(error.message.toLowerCase().includes('not confirmed') ? 'Este e-mail ainda não foi confirmado no Supabase. Confirme o usuário em Authentication → Users e tente novamente.' : 'E-mail ou senha inválidos. Use o botão “Esqueci minha senha” para criar uma nova senha.')
      return
    }
    navigate('/painel')
  }

  async function handleRecovery() {
    setNotice('')
    if (!email.trim()) { setNotice('Informe o e-mail para receber o link de recuperação.'); return }
    if (!supabaseConfigured || !supabase) { setNotice('Configure o Supabase para habilitar a recuperação de senha.'); return }
    setRecovering(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/painel/primeiro-acesso` })
    setRecovering(false)
    setNotice(error ? 'Não foi possível enviar o link. Confirme se o e-mail existe no Supabase e se esta URL está autorizada no Auth.' : 'Link enviado. Verifique o e-mail e abra o link no mesmo navegador para definir uma nova senha.')
  }

  async function handleGoogleLogin() {
    setNotice('')
    if (!supabaseConfigured || !supabase) { setNotice('Configure o Supabase para habilitar o acesso com Google.'); return }
    setGoogleSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/painel/primeiro-acesso`, queryParams: { prompt: 'select_account' } } })
    if (error) { setGoogleSubmitting(false); setNotice('Não foi possível abrir o Google. Confirme se o provedor Google está habilitado no Supabase e se as URLs estão autorizadas.') }
  }

  return <div className="grid min-h-screen bg-mist lg:grid-cols-[.9fr_1.1fr]"><section className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-circuit-grid bg-[length:38px_38px] opacity-30" /><div className="relative"><BrandMark dark /><div className="mt-24 max-w-md"><Badge tone="navy"><ShieldCheck className="h-3.5 w-3.5" /> Acesso seguro</Badge><h1 className="mt-6 font-display text-5xl font-extrabold leading-tight tracking-[-0.05em]">A operação DSS começa com clareza.</h1><p className="mt-6 text-base leading-7 text-white/60">Um espaço preparado para organizar clientes, solicitações e serviços com segurança.</p></div></div><p className="relative text-xs text-white/35">DSS — Deni Sistemas de Segurança</p></section><main className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><BrandMark /></div><Badge tone="blue"><LockKeyhole className="h-3.5 w-3.5" /> Painel administrativo</Badge><h2 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.05em] text-navy">Entrar no painel.</h2><p className="mt-4 text-sm leading-6 text-slate-600">Acesse a operação da DSS com suas credenciais.</p><form onSubmit={handleSubmit} className="mt-9 rounded-[2rem] border border-line bg-white p-6 shadow-soft sm:p-8"><Field label="E-mail" type="email" placeholder="voce@dss.com.br" value={email} onChange={(event) => setEmail(event.target.value)} required /><Field label="Senha" type="password" placeholder="Digite sua senha" className="mt-5" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => void handleRecovery()} disabled={recovering} className="mt-3 text-xs font-bold text-brand hover:underline disabled:opacity-60">{recovering ? 'Enviando link…' : 'Esqueci minha senha'}</button>{notice && <div className="mt-5 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm leading-6 text-brand" role="status">{notice}</div>}<Button type="submit" className="mt-7 w-full" disabled={submitting}>{submitting ? 'Verificando…' : 'Entrar'} {!submitting && <ArrowRight className="h-4 w-4" />}</Button><div className="my-6 flex items-center gap-3 text-xs font-bold text-slate-400"><span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" /></div><Button type="button" variant="secondary" className="w-full" onClick={() => void handleGoogleLogin()} disabled={googleSubmitting || submitting}><Chrome className="h-4 w-4" /> {googleSubmitting ? 'Abrindo Google…' : 'Continuar com Google'}</Button></form><p className="mt-6 text-center text-sm text-slate-500"><Link to="/" className="font-bold text-brand hover:underline">Voltar ao website</Link></p></div></main></div>
}
