// @ts-nocheck — compilada pelo runtime Deno do Supabase.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
function text(value: unknown, max = 200) { return typeof value === 'string' ? value.trim().slice(0, max) : '' }
async function hashToken(token: string) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)); return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('') }
function adminClient() { return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '') }

async function requireAdmin(request: Request, admin: ReturnType<typeof adminClient>) {
  const authorization = request.headers.get('Authorization')
  if (!authorization) return null
  const authClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authorization } } })
  const { data } = await authClient.auth.getUser()
  if (!data.user) return null
  const { data: profile } = await admin.from('profiles').select('id, company_id, role').eq('id', data.user.id).single()
  return profile && ['owner', 'admin'].includes(profile.role) ? profile : null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const body = await request.json().catch(() => null)
  const action = text(body?.action, 20)
  const admin = adminClient()
  if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return json({ error: 'server_not_configured' }, 503)

  if (action === 'create') {
    const profile = await requireAdmin(request, admin)
    if (!profile) return json({ error: 'unauthorized' }, 401)
    const quoteId = text(body?.quote_id, 80)
    const { data: quote } = await admin.from('quotes').select('id, company_id, valid_until').eq('id', quoteId).eq('company_id', profile.company_id).single()
    if (!quote) return json({ error: 'quote_not_found' }, 404)
    const rawToken = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`
    const tokenHash = await hashToken(rawToken)
    const requestedExpiry = body?.expires_at ? new Date(body.expires_at) : null
    const quoteExpiry = quote.valid_until ? new Date(`${quote.valid_until}T23:59:59Z`) : null
    const fallbackExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const expiresAt = requestedExpiry && !Number.isNaN(requestedExpiry.getTime()) ? requestedExpiry : quoteExpiry && quoteExpiry.getTime() > Date.now() ? quoteExpiry : fallbackExpiry
    await admin.from('quote_public_links').update({ expires_at: new Date().toISOString() }).eq('quote_id', quoteId).eq('company_id', profile.company_id).is('decision', null).gt('expires_at', new Date().toISOString())
    const { data: link, error } = await admin.from('quote_public_links').insert({ company_id: profile.company_id, quote_id: quoteId, token_hash: tokenHash, expires_at: expiresAt.toISOString() }).select('id, expires_at').single()
    if (error || !link) return json({ error: 'link_create_failed' }, 500)
    return json({ ok: true, token: rawToken, expires_at: link.expires_at })
  }

  const token = text(body?.token, 160)
  if (!token) return json({ error: 'token_required' }, 400)
  const tokenHash = await hashToken(token)
  const { data: link, error: linkError } = await admin.from('quote_public_links').select('id, quote_id, company_id, expires_at, decision').eq('token_hash', tokenHash).single()
  if (linkError || !link) return json({ error: 'link_not_found' }, 404)
  if (new Date(link.expires_at).getTime() < Date.now()) return json({ error: 'link_expired' }, 410)

  if (action === 'get') {
    await admin.from('quote_public_links').update({ viewed_at: new Date().toISOString() }).eq('id', link.id)
    const { data: quote } = await admin.from('quotes').select('id, status, valid_until, subtotal, discount, total, notes, created_at, customer:customers(full_name, email, phone), company:companies(name, phone, email), items:quote_items(description, quantity, unit_price, total)').eq('id', link.quote_id).single()
    if (!quote) return json({ error: 'quote_not_found' }, 404)
    return json({ ok: true, quote, decision: link.decision, expires_at: link.expires_at })
  }

  if (action === 'respond') {
    const decision = text(body?.decision, 20)
    if (!['approved', 'rejected'].includes(decision)) return json({ error: 'invalid_decision' }, 400)
    if (link.decision) return json({ error: 'already_decided', decision: link.decision }, 409)
    const { error: quoteError } = await admin.from('quotes').update({ status: decision }).eq('id', link.quote_id)
    if (quoteError) return json({ error: 'quote_update_failed' }, 500)
    await admin.from('quote_public_links').update({ decision, decided_at: new Date().toISOString() }).eq('id', link.id)
    await admin.from('activity_logs').insert({ company_id: link.company_id, action: `quote_${decision}`, entity_name: 'quotes', entity_id: link.quote_id, metadata: { source: 'public_link', decided_at: new Date().toISOString() } })
    return json({ ok: true, decision })
  }
  return json({ error: 'invalid_action' }, 400)
})
