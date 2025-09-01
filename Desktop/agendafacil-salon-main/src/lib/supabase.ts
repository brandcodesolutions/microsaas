import { createClient } from '@supabase/supabase-js'

// Estas variáveis devem ser configuradas no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do banco
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  service: string
  date: string
  time: string
  observations?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  user_id: string
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