import { createClient } from '@supabase/supabase-js'

// Estas variáveis devem ser configuradas no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('🔧 Supabase Config Debug:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// TIPOS PARA O NOVO ESQUEMA V2
// =====================================================

// Salão
export interface Salon {
  id: string
  slug: string
  name: string
  email?: string
  phone?: string
  address?: string
  description?: string
  business_hours?: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Serviço
export interface Service {
  id: string
  salon_id: string
  name: string
  description?: string
  duration_minutes: number
  price_cents: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Profissional
export interface Professional {
  id: string
  salon_id: string
  name: string
  specialty?: string
  email?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Perfil de usuário
export interface User {
  id: string
  salon_id?: string
  email: string
  name: string
  phone?: string
  role: 'client' | 'admin' | 'professional'
  created_at: string
  updated_at: string
}

// Agendamento (novo esquema)
export interface Appointment {
  id: string
  salon_id: string
  service_id?: string
  professional_id?: string
  user_id?: string
  client_name: string
  client_email: string
  client_phone: string
  service_name: string
  professional_name?: string
  appointment_date: string
  appointment_time: string
  duration_minutes?: number
  price_cents?: number
  observations?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  created_at: string
  updated_at: string
  cancelled_at?: string
  cancellation_reason?: string
}

// Dados para criar agendamento
export interface CreateAppointmentData {
  salon_id: string
  service_id?: string
  professional_id?: string
  user_id?: string
  client_name: string
  client_email: string
  client_phone: string
  service_name: string
  professional_name?: string
  appointment_date: string
  appointment_time: string
  duration_minutes?: number
  price_cents?: number
  observations?: string
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
}

// View detalhada de agendamentos
export interface AppointmentDetailed extends Appointment {
  salon_name?: string
  salon_phone?: string
  salon_address?: string
  service_full_name?: string
  service_duration?: number
  service_price?: number
  professional_full_name?: string
  professional_specialty?: string
  user_name?: string
  user_email?: string
}

// Tipos para autenticação
export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    name: string
    phone?: string
    address?: string
    description?: string
  }
}