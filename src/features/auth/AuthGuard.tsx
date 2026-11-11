import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { BrandMark } from '../../components/brand/BrandMark'
import { Badge } from '../../components/ui'
import { supabase, supabaseConfigured } from '../../lib/supabase/client'

function IntegrationRequired() {
  return <div className="flex min-h-screen items-center justify-center bg-mist px-5 py-10"><div className="w-full max-w-lg rounded-[2rem] border border-line bg-white p-8 text-center shadow-soft sm:p-10"><div className="flex justify-center"><BrandMark /></div><div className="mx-auto mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-brand"><LockKeyhole className="h-6 w-6" /></div><Badge tone="blue" className="mt-6">Painel protegido</Badge><h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy">Integração ainda não configurada.</h1><p className="mt-4 text-sm leading-6 text-slate-600">O painel administrativo permanece bloqueado até que o Supabase Auth e as variáveis de ambiente sejam configurados. Nenhum acesso de demonstração é liberado por segurança.</p><Link to="/painel/login" className="mt-7 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-brand">Ver acesso do painel <ArrowRight className="h-4 w-4" /></Link></div></div>
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session); setLoading(false) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  if (!supabaseConfigured) return <IntegrationRequired />
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-mist px-5"><p className="text-sm font-bold text-slate-500">Verificando sessão segura…</p></div>
  if (!session) return <Navigate to="/painel/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
