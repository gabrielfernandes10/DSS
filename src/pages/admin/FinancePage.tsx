import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Badge, Button, EmptyState, Field, SelectField, TextArea } from '../../components/ui'
import { supabase } from '../../lib/supabase/client'

type TransactionType = 'income' | 'expense'
type FormMode = 'combined' | 'single'

interface Order {
  id: string
  description: string | null
}

interface Transaction {
  id: string
  operation_id: string | null
  service_order_id: string | null
  type: TransactionType
  category: string
  description: string | null
  amount: number
  occurred_on: string
  paid: boolean
  created_at: string
}

interface TransactionForm {
  mode: FormMode
  service_order_id: string
  type: TransactionType
  category: string
  amount: number
  paid: boolean
  incomeCategory: string
  incomeAmount: number
  incomePaid: boolean
  expenseCategory: string
  expenseAmount: number
  expensePaid: boolean
  description: string
  occurred_on: string
}

interface FinancialOperation {
  id: string
  income?: Transaction
  expense?: Transaction
}

const emptyForm: TransactionForm = {
  mode: 'combined',
  service_order_id: '',
  type: 'income',
  category: '',
  amount: 0,
  paid: false,
  incomeCategory: 'Serviço realizado',
  incomeAmount: 0,
  incomePaid: false,
  expenseCategory: 'Material',
  expenseAmount: 0,
  expensePaid: false,
  description: '',
  occurred_on: new Date().toISOString().slice(0, 10),
}

const categories = [
  'Serviço realizado',
  'Venda de material',
  'Manutenção',
  'Combustível',
  'Material',
  'Fornecedor',
  'Imposto',
  'Outros',
]

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function operationId(transaction: Transaction) {
  return transaction.operation_id || transaction.id
}

function operationLabel(operation: FinancialOperation) {
  return operation.income?.description || operation.expense?.description || operation.income?.category || operation.expense?.category || 'Operação financeira'
}

export function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [form, setForm] = useState<TransactionForm>(emptyForm)
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadFinance() {
    if (!supabase) {
      setError('A integração com o Supabase não está disponível.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    const [transactionsResult, ordersResult] = await Promise.all([
      supabase
        .from('financial_transactions')
        .select('id, operation_id, service_order_id, type, category, description, amount, occurred_on, paid, created_at')
        .order('occurred_on', { ascending: false }),
      supabase.from('service_orders').select('id, description').order('created_at', { ascending: false }),
    ])

    const firstError = [transactionsResult, ordersResult].find((result) => result.error)
    if (firstError?.error) {
      setError(`Não foi possível carregar o financeiro: ${firstError.error.message}`)
    } else {
      setTransactions((transactionsResult.data ?? []) as Transaction[])
      setOrders((ordersResult.data ?? []) as Order[])
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadFinance()
  }, [])

  function startNew() {
    setEditingOperationId(null)
    setForm({ ...emptyForm, occurred_on: new Date().toISOString().slice(0, 10) })
    setShowForm(true)
    setNotice('')
    setError('')
  }

  function startEdit(operation: FinancialOperation) {
    const income = operation.income
    const expense = operation.expense
    const isCombined = Boolean(income && expense)

    setEditingOperationId(operation.id)
    setForm({
      mode: isCombined ? 'combined' : 'single',
      service_order_id: income?.service_order_id || expense?.service_order_id || '',
      type: income ? 'income' : 'expense',
      category: income?.category || expense?.category || '',
      amount: Number(income?.amount || expense?.amount || 0),
      paid: income?.paid || expense?.paid || false,
      incomeCategory: income?.category || 'Serviço realizado',
      incomeAmount: Number(income?.amount || 0),
      incomePaid: income?.paid || false,
      expenseCategory: expense?.category || 'Material',
      expenseAmount: Number(expense?.amount || 0),
      expensePaid: expense?.paid || false,
      description: income?.description || expense?.description || '',
      occurred_on: income?.occurred_on || expense?.occurred_on || new Date().toISOString().slice(0, 10),
    })
    setShowForm(true)
    setNotice('')
    setError('')
  }

  function buildRows(companyId: string, operation: string) {
    const common = {
      company_id: companyId,
      operation_id: operation,
      service_order_id: form.service_order_id || null,
      description: form.description.trim() || null,
      occurred_on: form.occurred_on,
    }

    if (form.mode === 'single') {
      return [{
        ...common,
        type: form.type,
        category: form.category.trim(),
        amount: Number(form.amount),
        paid: form.paid,
      }]
    }

    const rows = []
    if (Number(form.incomeAmount) > 0) {
      rows.push({
        ...common,
        type: 'income' as const,
        category: form.incomeCategory.trim(),
        amount: Number(form.incomeAmount),
        paid: form.incomePaid,
      })
    }
    if (Number(form.expenseAmount) > 0) {
      rows.push({
        ...common,
        type: 'expense' as const,
        category: form.expenseCategory.trim(),
        amount: Number(form.expenseAmount),
        paid: form.expensePaid,
      })
    }
    return rows
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    const hasSingleAmount = form.mode === 'single' && Number(form.amount) > 0
    const hasCombinedAmount = form.mode === 'combined' && (Number(form.incomeAmount) > 0 || Number(form.expenseAmount) > 0)
    if (!hasSingleAmount && !hasCombinedAmount) {
      setError('Informe pelo menos uma receita ou despesa maior que zero.')
      return
    }
    if (form.mode === 'single' && !form.category.trim()) {
      setError('Informe a categoria do lançamento.')
      return
    }
    if (form.mode === 'combined' && Number(form.incomeAmount) > 0 && !form.incomeCategory.trim()) {
      setError('Informe a categoria da receita.')
      return
    }
    if (form.mode === 'combined' && Number(form.expenseAmount) > 0 && !form.expenseCategory.trim()) {
      setError('Informe a categoria da despesa.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) {
      setError('Sua sessão expirou. Faça login novamente.')
      setSaving(false)
      return
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('id', userId).single()
    if (profileError || !profile?.company_id) {
      setError('Finalize o primeiro acesso da empresa antes de cadastrar lançamentos.')
      setSaving(false)
      return
    }

    const operation = editingOperationId || crypto.randomUUID()
    const rows = buildRows(profile.company_id, operation)
    let result: { error: Error | null } = { error: null }

    if (editingOperationId) {
      const existing = transactions.filter((transaction) => operationId(transaction) === editingOperationId)
      const existingByType = new Map(existing.map((transaction) => [transaction.type, transaction]))
      for (const row of rows) {
        const current = existingByType.get(row.type)
        const operationData = { ...row, operation_id: operation }
        const movementResult = current
          ? await supabase.from('financial_transactions').update(operationData).eq('id', current.id)
          : await supabase.from('financial_transactions').insert(operationData)
        if (movementResult.error) {
          result = { error: movementResult.error }
          break
        }
      }
      if (!result.error) {
        for (const current of existing) {
          if (!rows.some((row) => row.type === current.type)) {
            const removeResult = await supabase.from('financial_transactions').delete().eq('id', current.id)
            if (removeResult.error) {
              result = { error: removeResult.error }
              break
            }
          }
        }
      }
    } else {
      const insertResult = await supabase.from('financial_transactions').insert(rows)
      result = { error: insertResult.error }
    }

    if (result.error) {
      setError(`Não foi possível ${editingOperationId ? 'atualizar' : 'salvar'} o lançamento: ${result.error.message}`)
    } else {
      setForm(emptyForm)
      setEditingOperationId(null)
      setShowForm(false)
      setNotice(editingOperationId ? 'Lançamento atualizado.' : 'Lançamento criado com receita, despesa e lucro calculados.')
      await loadFinance()
    }
    setSaving(false)
  }

  async function togglePaid(transaction: Transaction) {
    if (!supabase) return
    const { error: updateError } = await supabase.from('financial_transactions').update({ paid: !transaction.paid }).eq('id', transaction.id)
    if (updateError) setError(`Não foi possível atualizar o pagamento: ${updateError.message}`)
    else {
      setNotice(transaction.paid ? 'Movimentação marcada como pendente.' : 'Movimentação marcada como paga/recebida.')
      await loadFinance()
    }
  }

  async function deleteOperation(operation: FinancialOperation) {
    if (!supabase || !window.confirm(`Excluir o lançamento "${operationLabel(operation)}"? Esta ação não pode ser desfeita.`)) return
    const { error: deleteError } = await supabase.from('financial_transactions').delete().eq('operation_id', operation.id)
    if (deleteError) setError(`Não foi possível excluir o lançamento: ${deleteError.message}`)
    else {
      setNotice('Lançamento excluído.')
      await loadFinance()
    }
  }

  const orderNames = new Map(orders.map((order) => [order.id, order.description || 'Ordem de serviço']))
  const operations = useMemo<FinancialOperation[]>(() => {
    const grouped = new Map<string, FinancialOperation>()
    for (const transaction of transactions) {
      const id = operationId(transaction)
      const current = grouped.get(id) || { id }
      current[transaction.type] = transaction
      grouped.set(id, current)
    }
    return [...grouped.values()]
  }, [transactions])

  const filtered = operations.filter((operation) => {
    const items = [operation.income, operation.expense].filter(Boolean) as Transaction[]
    const text = items.flatMap((item) => [item.category, item.description ?? '', orderNames.get(item.service_order_id ?? '') ?? '']).join(' ')
    return text.toLowerCase().includes(search.toLowerCase())
  })
  const income = useMemo(() => transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0), [transactions])
  const expense = useMemo(() => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0), [transactions])

  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><Badge tone="blue">Gestão</Badge><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-navy sm:text-4xl">Financeiro</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Registre uma operação com receita e custo no mesmo lançamento para acompanhar o lucro real de cada serviço.</p></div>
      <div className="flex gap-3"><Button variant="secondary" onClick={() => void loadFinance()} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar</Button><Button onClick={startNew}><Plus className="h-4 w-4" /> Novo lançamento</Button></div>
    </div>
    {notice && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm text-brand" role="status">{notice}</div>}
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{error}</div>}
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-emerald-600"><ArrowUpRight className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.14em]">Receitas</span></div><p className="mt-3 font-display text-2xl font-extrabold text-navy">{currency(income)}</p></div>
      <div className="rounded-3xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-red-600"><ArrowDownLeft className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.14em]">Despesas</span></div><p className="mt-3 font-display text-2xl font-extrabold text-navy">{currency(expense)}</p></div>
      <div className="rounded-3xl border border-line bg-navy p-5 text-white"><div className="flex items-center gap-2 text-cyan"><CircleDollarSign className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.14em]">Lucro / saldo</span></div><p className="mt-3 font-display text-2xl font-extrabold">{currency(income - expense)}</p></div>
    </div>
    {showForm && <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">{editingOperationId ? 'Editar lançamento' : 'Novo lançamento'}</p><h3 className="mt-2 font-display text-2xl font-extrabold text-navy">{editingOperationId ? 'Editar operação financeira' : 'Registrar receita e despesa'}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Informe os dois valores quando quiser calcular o lucro de um serviço. Se deixar um deles em branco, será criado somente o outro movimento.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-navy" aria-label="Fechar formulário"><X className="h-5 w-5" /></button></div>
      <form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2">
        <SelectField label="Formato do lançamento" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as FormMode })}><option value="combined">Receita + despesa na mesma operação</option><option value="single">Somente receita ou despesa</option></SelectField>
        {form.mode === 'single' ? <><SelectField label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TransactionType })}><option value="income">Receita</option><option value="expense">Despesa</option></SelectField><Field label="Categoria" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} list="finance-categories" required /><Field label="Valor (R$)" type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} required /></> : <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 md:col-span-2"><div className="grid gap-5 md:grid-cols-2"><div><div className="flex items-center gap-2 text-sm font-extrabold text-emerald-700"><ArrowUpRight className="h-4 w-4" /> Receita da operação</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Categoria" value={form.incomeCategory} onChange={(event) => setForm({ ...form, incomeCategory: event.target.value })} list="finance-categories" /><Field label="Valor (R$)" type="number" min="0" step="0.01" value={form.incomeAmount || ''} onChange={(event) => setForm({ ...form, incomeAmount: Number(event.target.value) })} /></div><label className="mt-4 flex items-center gap-3 text-sm font-bold text-navy"><input type="checkbox" checked={form.incomePaid} onChange={(event) => setForm({ ...form, incomePaid: event.target.checked })} className="h-4 w-4 accent-brand" /> Cliente já pagou/recebi</label></div><div><div className="flex items-center gap-2 text-sm font-extrabold text-red-700"><ArrowDownLeft className="h-4 w-4" /> Despesa da operação</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Categoria" value={form.expenseCategory} onChange={(event) => setForm({ ...form, expenseCategory: event.target.value })} list="finance-categories" /><Field label="Valor (R$)" type="number" min="0" step="0.01" value={form.expenseAmount || ''} onChange={(event) => setForm({ ...form, expenseAmount: Number(event.target.value) })} /></div><label className="mt-4 flex items-center gap-3 text-sm font-bold text-navy"><input type="checkbox" checked={form.expensePaid} onChange={(event) => setForm({ ...form, expensePaid: event.target.checked })} className="h-4 w-4 accent-brand" /> Material/fornecedor já pago</label></div></div></div>}
        <Field label="Data" type="date" value={form.occurred_on} onChange={(event) => setForm({ ...form, occurred_on: event.target.value })} required />
        <SelectField label="Ordem de serviço" value={form.service_order_id} onChange={(event) => setForm({ ...form, service_order_id: event.target.value })}><option value="">Sem ordem vinculada</option>{orders.map((order) => <option value={order.id} key={order.id}>{orderNames.get(order.id)}</option>)}</SelectField>
        <TextArea label="Descrição da operação" className="md:col-span-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Ex.: Instalação de cerca elétrica — cliente João" />
        {form.mode === 'single' && <label className="flex items-center gap-3 text-sm font-bold text-navy md:col-span-2"><input type="checkbox" checked={form.paid} onChange={(event) => setForm({ ...form, paid: event.target.checked })} className="h-4 w-4 accent-brand" /> Lançamento já foi pago/recebido</label>}
        <datalist id="finance-categories">{categories.map((category) => <option value={category} key={category} />)}</datalist>
        <div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Salvando…' : editingOperationId ? 'Atualizar lançamento' : 'Salvar lançamento'}</Button></div>
      </form>
    </section>}
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Operações financeiras</p><h3 className="mt-2 font-display text-xl font-extrabold text-navy">{loading ? 'Carregando financeiro…' : `${operations.length} ${operations.length === 1 ? 'operação' : 'operações'}`}</h3></div><label className="relative block sm:w-72"><span className="sr-only">Buscar lançamentos</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-full border border-line bg-mist py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Buscar operação" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      {loading ? <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-brand" /></div> : filtered.length === 0 ? <div className="mt-7"><EmptyState icon={<CircleDollarSign className="h-5 w-5" />} title={search ? 'Nenhum resultado encontrado' : 'Nenhuma operação registrada'} description={search ? 'Tente outra busca.' : 'Registre uma receita, uma despesa ou as duas na mesma operação.'} /></div> : <div className="mt-7 space-y-3">{filtered.map((operation) => { const incomeValue = Number(operation.income?.amount || 0); const expenseValue = Number(operation.expense?.amount || 0); const profit = incomeValue - expenseValue; const reference = operation.income || operation.expense; return <div key={operation.id} className="flex flex-col gap-4 rounded-2xl border border-line p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-cyan"><CircleDollarSign className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-bold text-navy">{operationLabel(operation)}</p><p className="mt-1 text-xs text-slate-500">{operation.income && `Receita: ${operation.income.category}`}{operation.income && operation.expense && ' · '}{operation.expense && `Despesa: ${operation.expense.category}`} · {reference && new Date(`${reference.occurred_on}T12:00:00`).toLocaleDateString('pt-BR')}{reference?.service_order_id ? ` · ${orderNames.get(reference.service_order_id) || 'Ordem vinculada'}` : ''}</p></div></div><div className="flex flex-wrap items-center gap-2 lg:justify-end">{operation.income && <><strong className="text-emerald-600">+ {currency(incomeValue)}</strong><button type="button" onClick={() => void togglePaid(operation.income!)} className={operation.income.paid ? 'rounded-full bg-cyan/10 px-3 py-1.5 text-xs font-bold text-brand' : 'rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700'}>{operation.income.paid ? 'Recebido' : 'A receber'}</button></>}{operation.expense && <><strong className="text-red-600">− {currency(expenseValue)}</strong><button type="button" onClick={() => void togglePaid(operation.expense!)} className={operation.expense.paid ? 'rounded-full bg-cyan/10 px-3 py-1.5 text-xs font-bold text-brand' : 'rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700'}>{operation.expense.paid ? 'Pago' : 'A pagar'}</button></>}{operation.income && operation.expense && <span className="rounded-full bg-navy px-3 py-1.5 text-xs font-extrabold text-white">Lucro {currency(profit)}</span>}<button type="button" onClick={() => startEdit(operation)} className="rounded-xl p-2 text-slate-400 hover:bg-mist hover:text-brand" aria-label="Editar lançamento"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void deleteOperation(operation)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir lançamento"><Trash2 className="h-4 w-4" /></button></div></div> })}</div>}
    </section>
  </div>
}
