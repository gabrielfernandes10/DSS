import { useState } from 'react'
import { Bell, ChevronDown, Menu, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from '../brand/BrandMark'
import { cn } from '../../lib/utils'

const navigation = [
  { to: '/painel', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/painel/clientes', label: 'Clientes', icon: '◌' },
  { to: '/painel/solicitacoes', label: 'Solicitações', icon: '↗' },
  { to: '/painel/orcamentos', label: 'Orçamentos', icon: '◈' },
  { to: '/painel/ordens', label: 'Ordens de serviço', icon: '◇' },
  { to: '/painel/agenda', label: 'Agenda', icon: '□' },
  { to: '/painel/financeiro', label: 'Financeiro', icon: '≈' },
]

const titles: Record<string, string> = {
  '/painel': 'Dashboard',
  '/painel/clientes': 'Clientes',
  '/painel/solicitacoes': 'Solicitações',
  '/painel/orcamentos': 'Orçamentos',
  '/painel/ordens': 'Ordens de serviço',
  '/painel/agenda': 'Agenda',
  '/painel/financeiro': 'Financeiro',
  '/painel/configuracoes': 'Configurações',
}

export function AdminLayout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const currentTitle = titles[location.pathname] ?? 'Painel DSS'
  return <div className="min-h-screen bg-mist text-ink">
    <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy px-5 py-6 transition-transform duration-300 lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between"><BrandMark dark /><button className="rounded-lg p-2 text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button></div>
      <div className="mt-10"><p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">Operação</p><nav className="mt-3 space-y-1">{navigation.map((item) => <NavLink to={item.to} end={item.end} key={item.to} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition', isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white')}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-base text-cyan">{item.icon}</span>{item.label}</NavLink>)}</nav></div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold text-white/80">Fundação em preparação</p><p className="mt-2 text-xs leading-5 text-white/45">Conecte o projeto Supabase para ativar os dados do painel.</p></div>
    </aside>
    {open && <button className="fixed inset-0 z-40 bg-navy/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
    <div className="min-h-screen lg:pl-72">
      <header className="sticky top-0 z-30 flex h-[77px] items-center justify-between border-b border-line bg-white/90 px-5 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-4"><button className="rounded-xl p-2 text-navy lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Painel DSS</p><h1 className="font-display text-xl font-extrabold tracking-[-0.03em] text-navy">{currentTitle}</h1></div></div><div className="flex items-center gap-3"><button className="relative rounded-xl border border-line p-2.5 text-slate-500 transition hover:border-brand hover:text-brand" aria-label="Notificações"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan" /></button><div className="hidden items-center gap-3 border-l border-line pl-4 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-extrabold text-brand">D</div><div><p className="text-xs font-bold text-navy">Administrador</p><p className="text-[11px] text-slate-400">Acesso principal</p></div><ChevronDown className="h-4 w-4 text-slate-400" /></div></div></header>
      <main className="p-5 lg:p-8"><Outlet /></main>
    </div>
  </div>
}
