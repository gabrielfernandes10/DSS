import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../lib/utils'

const buttonBase = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'dark' }) {
  return <button className={cn(buttonBase, {
    'bg-cyan text-navy shadow-[0_10px_24px_rgba(25,182,201,0.22)] hover:-translate-y-0.5 hover:bg-[#31c8d8]': variant === 'primary',
    'border border-line bg-white text-navy hover:border-brand hover:text-brand': variant === 'secondary',
    'bg-transparent text-brand hover:bg-brand/5': variant === 'ghost',
    'bg-navy text-white shadow-[0_10px_24px_rgba(16,29,50,0.18)] hover:-translate-y-0.5 hover:bg-[#182945]': variant === 'dark',
  }, className)} {...props} />
}

export function ButtonLink({ className, variant = 'primary', ...props }: LinkProps & { variant?: 'primary' | 'secondary' | 'ghost' | 'dark' }) {
  return <Link className={cn(buttonBase, {
    'bg-cyan text-navy shadow-[0_10px_24px_rgba(25,182,201,0.22)] hover:-translate-y-0.5 hover:bg-[#31c8d8]': variant === 'primary',
    'border border-line bg-white text-navy hover:border-brand hover:text-brand': variant === 'secondary',
    'bg-transparent text-brand hover:bg-brand/5': variant === 'ghost',
    'bg-navy text-white shadow-[0_10px_24px_rgba(16,29,50,0.18)] hover:-translate-y-0.5 hover:bg-[#182945]': variant === 'dark',
  }, className)} {...props} />
}

export function Badge({ children, tone = 'cyan', className }: { children: ReactNode; tone?: 'cyan' | 'navy' | 'blue' | 'muted'; className?: string }) {
  return <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em]', {
    'bg-cyan/10 text-brand': tone === 'cyan',
    'bg-white/10 text-cyan': tone === 'navy',
    'bg-brand/10 text-brand': tone === 'blue',
    'bg-mist text-slate-500': tone === 'muted',
  }, className)}>{children}</span>
}

export function SectionHeading({ eyebrow, title, description, align = 'left' }: { eyebrow: string; title: string; description?: string; align?: 'left' | 'center' }) {
  return <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
    <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
    <h2 className="font-display text-3xl font-extrabold leading-tight tracking-[-0.03em] text-navy sm:text-4xl">{title}</h2>
    {description && <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>}
  </div>
}

export function Field({ label, hint, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className={cn('block', className)}>
    <span className="mb-2 block text-sm font-bold text-navy">{label}</span>
    <input className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10" {...props} />
    {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
  </label>
}

export function TextArea({ label, hint, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return <label className={cn('block', className)}>
    <span className="mb-2 block text-sm font-bold text-navy">{label}</span>
    <textarea className="min-h-32 w-full resize-y rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10" {...props} />
    {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
  </label>
}

export function SelectField({ label, children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className={cn('block', className)}>
    <span className="mb-2 block text-sm font-bold text-navy">{label}</span>
    <select className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" {...props}>{children}</select>
  </label>
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-brand">{icon}</div>
    <h3 className="font-display text-lg font-extrabold text-navy">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>
}
