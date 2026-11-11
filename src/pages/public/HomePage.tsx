import { ArrowRight, Camera, Check, ChevronRight, LockKeyhole, Settings2, ShieldCheck, Siren, Smartphone, Wrench } from 'lucide-react'
import { Badge, ButtonLink, SectionHeading } from '../../components/ui'
import { BrandMark } from '../../components/brand/BrandMark'

const highlights = [
  { icon: ShieldCheck, label: 'Proteção', text: 'Cercas elétricas e fechaduras eletrônicas' },
  { icon: Settings2, label: 'Automação', text: 'Motores e controles de portão' },
  { icon: Smartphone, label: 'Conectividade', text: 'Câmeras com acesso pelo celular' },
]

const services = [
  { icon: ShieldCheck, title: 'Cercas elétricas', text: 'Instalação e conserto para reforçar os limites da sua propriedade.' },
  { icon: Settings2, title: 'Motores de portão', text: 'Automação com instalação e manutenção para o dia a dia.' },
  { icon: Camera, title: 'Câmeras de segurança', text: 'Monitoramento com acesso pelo celular, onde você estiver.' },
]

export function HomePage() {
  return <div>
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 bg-circuit-grid bg-[length:44px_44px] opacity-40" />
      <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-cyan/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
        <div className="animate-rise">
          <Badge tone="navy"><span className="h-1.5 w-1.5 rounded-full bg-cyan" /> Segurança que acompanha sua rotina</Badge>
          <h1 className="mt-7 max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Proteção bem instalada começa com uma avaliação precisa.</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg">A DSS cuida da segurança e automação de residências e condomínios com soluções pensadas para funcionar de verdade.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><ButtonLink to="/orcamento">Solicitar orçamento <ArrowRight className="h-4 w-4" /></ButtonLink><ButtonLink to="/servicos" variant="ghost" className="text-white hover:bg-white/10">Conhecer serviços</ButtonLink></div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs font-bold text-white/55"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan" /> Atendimento local</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan" /> Para casas e condomínios</span></div>
        </div>
        <div className="animate-rise-delay relative">
          <div className="absolute -left-8 top-10 hidden h-24 w-24 rounded-full border border-cyan/30 lg:block" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan">Painel de confiança</p><p className="mt-2 font-display text-2xl font-extrabold">Seu próximo passo</p></div><BrandMark dark compact /></div>
            <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.06] p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan"><Siren className="h-5 w-5" /></span><div><p className="text-sm font-bold">Avaliação orientada</p><p className="mt-1 text-xs text-white/45">Entenda a necessidade antes de escolher a solução.</p></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-cyan" /></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">{highlights.map(({ icon: Icon, label, text }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Icon className="h-5 w-5 text-cyan" /><p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-white/45">{label}</p><p className="mt-2 text-sm font-bold leading-5 text-white/85">{text}</p></div>)}</div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><SectionHeading eyebrow="Soluções DSS" title="Tecnologia útil, instalação cuidadosa e suporte próximo." description="Da entrada da casa ao acesso do condomínio, a DSS reúne as soluções que deixam sua rotina mais segura e prática." /><div className="mt-12 grid gap-5 md:grid-cols-3">{services.map(({ icon: Icon, title, text }) => <article key={title} className="group rounded-3xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/50 hover:shadow-panel"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-brand transition-colors group-hover:bg-cyan group-hover:text-navy"><Icon className="h-6 w-6" /></div><h3 className="mt-7 font-display text-xl font-extrabold text-navy">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p><ButtonLink to="/servicos" variant="ghost" className="mt-5 -ml-2 px-2">Ver detalhes <ChevronRight className="h-4 w-4" /></ButtonLink></article>)}</div></section>

    <section className="bg-mist"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:px-8 lg:py-24"><div><Badge tone="blue">Por que a DSS</Badge><h2 className="mt-5 max-w-xl font-display text-4xl font-extrabold leading-tight tracking-[-0.04em] text-navy sm:text-5xl">Segurança que faz sentido para o seu espaço.</h2></div><div className="grid gap-7 sm:grid-cols-2"><div className="border-l-2 border-cyan pl-5"><p className="font-display text-lg font-extrabold text-navy">Olhar técnico</p><p className="mt-2 text-sm leading-6 text-slate-600">Cada solução começa pela compreensão do ambiente e da rotina de quem usa.</p></div><div className="border-l-2 border-brand pl-5"><p className="font-display text-lg font-extrabold text-navy">Orientação clara</p><p className="mt-2 text-sm leading-6 text-slate-600">Você entende as opções e o próximo passo antes de tomar uma decisão.</p></div></div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="relative overflow-hidden rounded-[2rem] bg-brand p-8 text-white sm:p-12 lg:p-16"><div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" /><div className="relative max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan">Vamos conversar</p><h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Conte o que você precisa proteger.</h2><p className="mt-4 max-w-xl text-base leading-7 text-white/70">A DSS ajuda a organizar o próximo passo com clareza, seja para uma nova instalação ou para assistência técnica.</p><ButtonLink to="/orcamento" variant="primary" className="mt-8">Solicitar orçamento <ArrowRight className="h-4 w-4" /></ButtonLink></div></div></section>
  </div>
}
