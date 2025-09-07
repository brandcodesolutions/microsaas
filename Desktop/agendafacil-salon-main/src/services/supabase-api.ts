import { supabase, type User, type Appointment, type CreateAppointmentData, type Salon, type Service, type Professional, type AuthUser } from '@/lib/supabase'
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

// =====================================================
// SERVIÇOS PARA O NOVO ESQUEMA V2
// =====================================================

// Serviços de Salões
export const salonService = {
  // Buscar salão por ID (adaptado para o schema simplificado)
  async getById(id: string): Promise<ApiResponse<Salon>> {
    try {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar salão' }
    }
  },

  // Buscar salão por nome (para compatibilidade)
  async getBySlug(slug: string): Promise<ApiResponse<Salon>> {
    try {
      // No schema simplificado, vamos buscar pelo nome
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .ilike('name', `%${slug}%`)
        .limit(1)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar salão' }
    }
  },

  // Buscar salão do usuário logado
  async getCurrentUserSalon(): Promise<ApiResponse<Salon>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          salon_id,
          salons (
            id,
            name,
            email,
            phone,
            address,
            created_at
          )
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.salons) {
        return { success: false, error: 'Salão não encontrado para este usuário' }
      }

      return { success: true, data: data.salons as Salon }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar salão do usuário' }
    }
  },

  // Listar todos os salões
  async getAll(): Promise<ApiResponse<Salon[]>> {
    try {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .order('name')

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar salões' }
    }
  }
}

// Serviços de Serviços
export const serviceService = {
  // Buscar serviços por salão
  async getBySalonId(salonId: string): Promise<ApiResponse<Service[]>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        // .eq('is_active', true) // Coluna não existe na tabela
        .order('name')

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar serviços' }
    }
  }
}

// Serviços de Profissionais
export const professionalService = {
  // Buscar profissionais por salão
  async getBySalonId(salonId: string): Promise<ApiResponse<Professional[]>> {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salonId)
        .order('name')

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar profissionais' }
    }
  }
}

// Serviços de Agendamentos (REDESENHADO)
export const appointmentService = {
  // Criar agendamento (novo esquema)
  async create(appointmentData: CreateAppointmentData): Promise<ApiResponse<Appointment>> {
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

  // Criar agendamento simplificado (para formulário público)
  async createSimple(data: {
    salonSlug: string
    clientName: string
    clientEmail: string
    clientPhone: string
    serviceName: string
    professionalName?: string
    appointmentDate: string
    appointmentTime: string
    observations?: string
  }): Promise<ApiResponse<Appointment>> {
    try {
      // Primeiro, buscar o salão pelo slug
      const salonResponse = await salonService.getBySlug(data.salonSlug)
      if (!salonResponse.success || !salonResponse.data) {
        return { success: false, error: 'Salão não encontrado' }
      }

      const salon = salonResponse.data

      // Buscar serviço e profissional (se especificados)
      let serviceId: string | undefined
      let professionalId: string | undefined
      let durationMinutes = 60
      let priceCents = 0

      // Buscar serviço pelo nome
      const servicesResponse = await serviceService.getBySalonId(salon.id)
      if (servicesResponse.success && servicesResponse.data) {
        const service = servicesResponse.data.find(s => s.name === data.serviceName)
        if (service) {
          serviceId = service.id
          durationMinutes = service.duration_minutes
          priceCents = service.price_cents
        }
      }

      // Buscar profissional pelo nome (se especificado)
      if (data.professionalName) {
        const professionalsResponse = await professionalService.getBySalonId(salon.id)
        if (professionalsResponse.success && professionalsResponse.data) {
          const professional = professionalsResponse.data.find(p => p.name === data.professionalName)
          if (professional) {
            professionalId = professional.id
          }
        }
      }

      // Criar agendamento
      const appointmentData: CreateAppointmentData = {
        salon_id: salon.id,
        service_id: serviceId,
        professional_id: professionalId,
        client_name: data.clientName,
        client_email: data.clientEmail,
        client_phone: data.clientPhone,
        service_name: data.serviceName,
        professional_name: data.professionalName,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        duration_minutes: durationMinutes,
        price_cents: priceCents,
        observations: data.observations,
        status: 'pending'
      }

      return await this.create(appointmentData)
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
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

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
  },

  // Listar agendamentos por salão
  async getBySalonId(salonId: string): Promise<ApiResponse<AppointmentDetailed[]>> {
    try {
      const { data, error } = await supabase
        .from('appointments_detailed')
        .select('*')
        .eq('salon_id', salonId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: 'Erro ao buscar agendamentos do salão' }
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