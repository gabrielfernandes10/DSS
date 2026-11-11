import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function BrandMark({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return <Link to="/" className={cn('group inline-flex items-center gap-3', dark ? 'text-white' : 'text-navy')} aria-label="DSS — Deni Sistemas de Segurança">
    <span className={cn('relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl transition-transform duration-200 group-hover:-rotate-3', dark ? 'bg-white/10' : 'bg-navy')}>
      <span className="absolute inset-0 bg-circuit-grid bg-[length:12px_12px] opacity-30" />
      <ShieldCheck className="relative z-10 h-6 w-6 text-cyan" strokeWidth={2.4} />
    </span>
    {!compact && <span className="leading-none">
      <span className="block font-display text-[17px] font-extrabold tracking-[-0.04em]">DSS</span>
      <span className={cn('mt-1 block text-[9px] font-extrabold uppercase tracking-[0.17em]', dark ? 'text-white/55' : 'text-slate-500')}>Deni Sistemas</span>
    </span>}
  </Link>
}
