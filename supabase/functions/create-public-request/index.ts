// @ts-nocheck — esta função é compilada pelo runtime Deno do Supabase, não pelo Vite.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const body = await request.json().catch(() => null)
  if (body?.website) return json({ ok: true })

  const kind = text(body?.kind, 20)
  if (!['budget', 'assistance', 'contact'].includes(kind)) return json({ error: 'invalid_kind' }, 400)

  const fullName = text(body?.full_name, 120)
  const email = text(body?.email, 160).toLowerCase()
  const phone = text(body?.phone, 40)
  const service = text(body?.service, 100)
  const requestType = text(body?.request_type, 80)
  const priorityLabel = text(body?.priority, 80)
  const message = text(body?.message, 2000)
  const companySlug = text(body?.company_slug || 'dss', 80).toLowerCase()

  if (fullName.length < 2 || message.length < 5 || (kind === 'budget' && !email) || (kind === 'assistance' && !phone)) {
    return json({ error: 'required_fields_missing' }, 400)
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey) return json({ error: 'server_not_configured' }, 503)

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'unknown'
  const guardKey = await sha256(`${ip}|${email || phone}|${kind}`)
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: recent } = await admin.from('public_submission_guards').select('id').eq('guard_key_hash', guardKey).gte('created_at', since).limit(1)
  if (recent?.length) return json({ error: 'rate_limited' }, 429)
  await admin.from('public_submission_guards').insert({ guard_key_hash: guardKey, kind })
  await admin.from('public_submission_guards').delete().lt('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())

  const { data: company, error: companyError } = await admin.from('companies').select('id').eq('slug', companySlug).single()
  if (companyError || !company) return json({ error: 'company_not_found' }, 404)

  let customer = null
  if (email) {
    const result = await admin.from('customers').select('id, full_name, email, phone').eq('company_id', company.id).eq('email', email).maybeSingle()
    customer = result.data
  }
  if (!customer && phone) {
    const result = await admin.from('customers').select('id, full_name, email, phone').eq('company_id', company.id).eq('phone', phone).maybeSingle()
    customer = result.data
  }

  if (customer) {
    await admin.from('customers').update({ full_name: fullName, email: email || customer.email, phone: phone || customer.phone }).eq('id', customer.id)
  } else {
    const result = await admin.from('customers').insert({ company_id: company.id, full_name: fullName, email: email || null, phone: phone || null, customer_type: 'individual' }).select('id').single()
    if (result.error || !result.data) return json({ error: 'customer_create_failed' }, 500)
    customer = result.data
  }

  const serviceType = service ? (await admin.from('service_types').select('id').eq('company_id', company.id).ilike('name', service).maybeSingle()).data : null
  const priority = kind === 'assistance' ? (priorityLabel === 'Equipamento parado' ? 'urgent' : priorityLabel === 'Precisa de atenção' ? 'high' : 'normal') : 'normal'
  const subject = kind === 'budget' ? `Orçamento — ${service || requestType || 'Nova necessidade'}` : kind === 'assistance' ? `Assistência — ${service || 'Equipamento'}` : 'Contato pelo site'
  const description = [requestType && `Tipo de atendimento: ${requestType}`, service && `Solução/equipamento: ${service}`, priorityLabel && `Prioridade percebida: ${priorityLabel}`, message].filter(Boolean).join('\n\n')

  const { error: requestError } = await admin.from('service_requests').insert({ company_id: company.id, customer_id: customer.id, service_type_id: serviceType?.id || null, status: 'new', source: 'public_form', subject, description, priority })
  if (requestError) return json({ error: 'request_create_failed' }, 500)

  return json({ ok: true })
})
