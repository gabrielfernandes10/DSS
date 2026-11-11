export type StaffRole = 'owner' | 'admin' | 'staff'

export type RequestStatus = 'new' | 'in_review' | 'quoted' | 'scheduled' | 'closed'

export type EntityName =
  | 'companies'
  | 'profiles'
  | 'customers'
  | 'customer_addresses'
  | 'service_types'
  | 'service_requests'
  | 'request_attachments'
  | 'quotes'
  | 'quote_items'
  | 'service_orders'
  | 'appointments'
  | 'financial_transactions'
  | 'activity_logs'

export interface Company {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface Profile {
  id: string
  companyId: string
  fullName: string
  role: StaffRole
  active: boolean
}

export interface ServiceType {
  id: string
  companyId: string
  name: string
  description: string
  active: boolean
}

export interface ServiceRequest {
  id: string
  companyId: string
  customerId: string | null
  serviceTypeId: string | null
  status: RequestStatus
  source: 'public_form' | 'admin'
  createdAt: string
}
