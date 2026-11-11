import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Badge, EmptyState } from '../../components/ui'

export function ModulePage({ eyebrow, title, description, icon: Icon, actionLabel }: { eyebrow: string; title: string; description: string; icon: LucideIcon; actionLabel?: string }) {
  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone="blue">{eyebrow}</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{actionLabel && <button className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand">{actionLabel} <ArrowRight className="h-4 w-4" /></button>}</div><div className="mt-9"><EmptyState icon={<Icon className="h-5 w-5" />} title="Nenhum registro ainda" description="Este módulo está preparado para receber dados reais após a conexão com o Supabase e a aplicação das políticas RLS." /></div></div>
}
