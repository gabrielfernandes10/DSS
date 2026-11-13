// @ts-nocheck — esta função é compilada pelo runtime Deno do Supabase, não pelo Vite.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type QuoteRow = {
  id: string
  company_id: string
  status: string
  valid_until: string | null
  subtotal: number
  discount: number
  total: number
  notes: string | null
  customer: { full_name: string; email: string | null } | null
  company: { name: string; phone: string | null; email: string | null } | null
  items: Array<{ description: string; quantity: number; unit_price: number; total: number }>
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'missing_authorization' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401)

  const body = await request.json().catch(() => null) as { quote_id?: string } | null
  if (!body?.quote_id) return json({ error: 'quote_id_required' }, 400)

  const { data: quote, error: quoteError } = await supabase.from('quotes').select('id, company_id, status, valid_until, subtotal, discount, total, notes, customer:customers(full_name, email), company:companies(name, phone, email), items:quote_items(description, quantity, unit_price, total)').eq('id', body.quote_id).single()
  if (quoteError || !quote) return json({ error: 'quote_not_found' }, 404)

  const typedQuote = quote as unknown as QuoteRow
  if (!typedQuote.customer?.email) return json({ error: 'customer_email_missing' }, 400)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'resend_not_configured' }, 503)

  const companyName = typedQuote.company?.name ?? 'Deni Sistemas de Segurança'
  const itemRows = (typedQuote.items ?? []).map((item) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e7edf3">${item.description}</td><td style="padding:10px 0;border-bottom:1px solid #e7edf3;text-align:center">${item.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #e7edf3;text-align:right">${money(Number(item.total))}</td></tr>`).join('')
  const validUntil = typedQuote.valid_until ? new Date(`${typedQuote.valid_until}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informada'
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3f6fa;font-family:Arial,sans-serif;color:#101d32"><div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#101d32;padding:28px 32px;color:#fff"><div style="font-size:12px;letter-spacing:2px;color:#19b6c9;font-weight:bold">DSS</div><h1 style="margin:12px 0 0;font-size:26px">Orçamento para ${typedQuote.customer.full_name}</h1></div><div style="padding:32px"><p style="font-size:16px;line-height:1.6">Olá, ${typedQuote.customer.full_name}. Segue o orçamento preparado pela ${companyName}.</p><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr><th style="text-align:left;padding:10px 0;border-bottom:2px solid #19b6c9">Item</th><th style="padding:10px 0;border-bottom:2px solid #19b6c9">Qtd.</th><th style="text-align:right;padding:10px 0;border-bottom:2px solid #19b6c9">Total</th></tr></thead><tbody>${itemRows}</tbody></table><div style="margin-top:24px;text-align:right;font-size:14px;line-height:1.8"><div>Subtotal: <strong>${money(Number(typedQuote.subtotal))}</strong></div><div>Desconto: <strong>${money(Number(typedQuote.discount))}</strong></div><div style="font-size:20px;color:#1769aa">Total: <strong>${money(Number(typedQuote.total))}</strong></div></div><p style="margin-top:24px;font-size:14px;color:#5d6b7d">Validade: ${validUntil}</p>${typedQuote.notes ? `<p style="font-size:14px;color:#5d6b7d"><strong>Observações:</strong> ${typedQuote.notes}</p>` : ''}<p style="margin-top:32px;font-size:14px;line-height:1.6;color:#5d6b7d">Em caso de dúvidas, responda este e-mail${typedQuote.company?.phone ? ` ou fale conosco pelo telefone ${typedQuote.company.phone}` : ''}.</p></div></div></body></html>`

  const resendResponse = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'DSS <onboarding@resend.dev>', to: [typedQuote.customer.email], subject: `Orçamento — ${companyName}`, html }) })
  if (!resendResponse.ok) return json({ error: 'email_provider_failed', details: await resendResponse.text() }, 502)

  const { error: statusError } = await supabase.from('quotes').update({ status: 'sent' }).eq('id', typedQuote.id)
  if (statusError) return json({ error: 'quote_status_update_failed' }, 500)
  await supabase.from('activity_logs').insert({ company_id: typedQuote.company_id, actor_profile_id: userData.user.id, action: 'quote_sent', entity_name: 'quotes', entity_id: typedQuote.id, metadata: { recipient: typedQuote.customer.email, sent_at: new Date().toISOString() } })

  return json({ ok: true, status: 'sent' })
})
