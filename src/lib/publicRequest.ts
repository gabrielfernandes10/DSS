import { supabase } from './supabase/client'

export type PublicRequestKind = 'budget' | 'assistance' | 'contact'

export interface PublicRequestPayload {
  kind: PublicRequestKind
  company_slug?: string
  full_name: string
  email?: string
  phone?: string
  service?: string
  request_type?: string
  priority?: string
  message: string
  website?: string
}

export async function submitPublicRequest(payload: PublicRequestPayload) {
  if (!supabase) {
    return { error: new Error('O formulário ainda não está conectado ao servidor.') }
  }

  const { data, error } = await supabase.functions.invoke('create-public-request', { body: payload })
  if (error) return { error }
  if (!data?.ok) return { error: new Error('Não foi possível registrar sua solicitação.') }
  return { data }
}
