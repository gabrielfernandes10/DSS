import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '../brand/BrandMark'
import { ButtonLink } from '../ui'
import { cn } from '../../lib/utils'

const links = [
  { to: '/servicos', label: 'Serviços' },
  { to: '/sobre', label: 'Sobre a DSS' },
  { to: '/assistencia', label: 'Assistência' },
  { to: '/contato', label: 'Contato' },
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  return <div className="min-h-screen bg-white text-ink">
    <div className="bg-navy px-5 py-2 text-center text-[11px] font-semibold tracking-wide text-white/80">
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan align-middle" />
      Atendimento para residências e condomínios em Porto Alegre
    </div>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => cn('text-sm font-bold transition-colors hover:text-brand', isActive ? 'text-brand' : 'text-slate-600')}>{link.label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <NavLink to="/painel/login" className="text-sm font-bold text-slate-600 transition-colors hover:text-brand">Acesso interno</NavLink>
          <ButtonLink to="/orcamento" className="px-4 py-2.5">Solicitar orçamento <ArrowUpRight className="h-4 w-4" /></ButtonLink>
        </div>
        <button className="rounded-xl p-2 text-navy lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="border-t border-line bg-white px-5 py-5 lg:hidden">
        <nav className="flex flex-col gap-4" aria-label="Navegação móvel">
          {links.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-base font-bold text-slate-700">{link.label}</NavLink>)}
          <div className="mt-2 flex flex-col gap-3 border-t border-line pt-4">
            <NavLink to="/painel/login" onClick={() => setOpen(false)} className="text-sm font-bold text-slate-600">Acesso interno</NavLink>
            <ButtonLink to="/orcamento" onClick={() => setOpen(false)}>Solicitar orçamento <ArrowUpRight className="h-4 w-4" /></ButtonLink>
          </div>
        </nav>
      </div>}
    </header>
    <main><Outlet /></main>
    <footer className="border-t border-line bg-mist">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div><BrandMark /><p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">Soluções de segurança e automação para residências e condomínios em Porto Alegre.</p></div>
        <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-navy">Explorar</p><div className="mt-4 space-y-3 text-sm text-slate-600">{links.slice(0, 3).map((link) => <NavLink className="block transition hover:text-brand" to={link.to} key={link.to}>{link.label}</NavLink>)}</div></div>
        <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-navy">Próximo passo</p><p className="mt-4 text-sm leading-6 text-slate-600">Conte o que você precisa proteger. A DSS ajuda a organizar a solução.</p><ButtonLink to="/orcamento" variant="dark" className="mt-5">Falar com a DSS <ArrowUpRight className="h-4 w-4" /></ButtonLink></div>
      </div>
      <div className="border-t border-line px-5 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} DSS — Deni Sistemas de Segurança.</div>
    </footer>
  </div>
}
