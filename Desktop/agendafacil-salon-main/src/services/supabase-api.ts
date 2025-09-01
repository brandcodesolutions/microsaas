import { supabase, type User, type Appointment, type AuthUser } from '@/lib/supabase'
import { AuthError, PostgrestError } from '@supabase/supabase-js'

// Tipos para respostas da API
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Serviços de Autenticação
export const authService = {
  // Registrar novo usuário
  async signUp(email: string, password: string, userData: {
    name: string
    phone?: string
    address?: string
    description?: string
  }): Promise<ApiResponse<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        return {
          success: true,
          data: {
            id: data.user.id,
            email: data.user.email!,
            user_metadata: data.user.user_metadata as AuthUser['user_metadata']
          }
        }
      }

      return { success: false, error: 'Falha ao criar usuário' }
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Login
  async signIn(email: string, password: string): Promise<ApiResponse<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: 'Credenciais inválidas' }
      }

      if (data.user) {
        return {
          success: true,
          data: {
            id: data.user.id,
            email: data.user.email!,
            user_metadata: data.user.user_metadata as AuthUser['user_metadata']
          }
        }
      }

      return { success: false, error: 'Falha no login' }
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' }
    }
  },

  // Logout
  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro ao fazer logout' }
    }
  },

  // Obter usuário atual
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        return {
          id: user.id,
          email: user.email!,
          user_metadata: user.user_metadata as AuthUser['user_metadata']
        }
      }
      return null
    } catch (error) {
      return null
    }
  },

  // Verificar se usuário está logado
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      return false
    }
  }
}

// Serviços de Agendamentos
export const appointmentService = {
  // Criar agendamento
  async create(appointmentData: Omit<Appointment, 'id' | 'created_at'>): Promise<ApiResponse<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Erro ao criar agendamento' }
    }
  },

  // Listar agendamentos do usuário
  async getByUserId(userId: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar agendamentos' }
    }
  },

  // Atualizar agendamento
  async update(id: string, updates: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar agendamento' }
    }
  },

  // Deletar agendamento
  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro ao deletar agendamento' }
    }
  }
}

// Serviços de Usuário (perfil)
export const userService = {
  // Atualizar perfil do usuário
  async updateProfile(updates: {
    name?: string
    phone?: string
    address?: string
    description?: string
  }): Promise<ApiResponse<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        return {
          success: true,
          data: {
            id: data.user.id,
            email: data.user.email!,
            user_metadata: data.user.user_metadata as AuthUser['user_metadata']
          }
        }
      }

      return { success: false, error: 'Falha ao atualizar perfil' }
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar perfil' }
    }
  }
}

// Exportar todos os serviços
export const supabaseApi = {
  auth: authService,
  appointments: appointmentService,
  user: userService
}