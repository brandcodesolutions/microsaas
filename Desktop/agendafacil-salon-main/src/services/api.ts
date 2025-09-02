import { supabase } from '../lib/supabase';

// Interfaces simplificadas para a nova estrutura
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: 'admin' | 'client';
  salon_id?: string;
  created_at: string;
}

export interface Salon {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  salon_id: string;
  service_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  price_cents?: number;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  salons?: Salon;
  services?: Service;
}

export interface CreateAppointmentData {
  salon_id: string;
  service_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  price_cents?: number;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

class ApiService {
  // Autenticação
  async signUp(email: string, password: string, userData: { name: string; phone?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Perfil do usuário
  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      throw error;
    }
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Salões
  async getSalons(): Promise<Salon[]> {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getSalon(salonId: string): Promise<Salon | null> {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('id', salonId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Serviços
  async getServices(salonId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Agendamentos
  async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select(`
        *,
        salons(name, phone, address),
        services(name, duration_minutes, price_cents)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        salons(name, phone, address),
        services(name, duration_minutes, price_cents)
      `)
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getSalonAppointments(salonId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        salons(name, phone, address),
        services(name, duration_minutes, price_cents)
      `)
      .eq('salon_id', salonId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select(`
        *,
        salons(name, phone, address),
        services(name, duration_minutes, price_cents)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
    
    if (error) throw error;
  }
}

export const apiService = new ApiService();

// Funções de conveniência
export const auth = {
  signUp: (email: string, password: string, userData: { name: string; phone?: string }) => 
    apiService.signUp(email, password, userData),
  signIn: (email: string, password: string) => 
    apiService.signIn(email, password),
  signOut: () => 
    apiService.signOut(),
  getCurrentUser: () => 
    apiService.getCurrentUser()
};

export const profiles = {
  get: (userId: string) => 
    apiService.getUserProfile(userId),
  update: (userId: string, updates: Partial<Profile>) => 
    apiService.updateUserProfile(userId, updates)
};

export const salons = {
  getAll: () => 
    apiService.getSalons(),
  get: (salonId: string) => 
    apiService.getSalon(salonId)
};

export const services = {
  getBySalon: (salonId: string) => 
    apiService.getServices(salonId)
};

export const appointments = {
  create: (data: CreateAppointmentData) => 
    apiService.createAppointment(data),
  getByUser: (userId: string) => 
    apiService.getUserAppointments(userId),
  getBySalon: (salonId: string) => 
    apiService.getSalonAppointments(salonId),
  updateStatus: (appointmentId: string, status: Appointment['status']) => 
    apiService.updateAppointmentStatus(appointmentId, status),
  delete: (appointmentId: string) => 
    apiService.deleteAppointment(appointmentId)
};