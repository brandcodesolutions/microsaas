const API_BASE_URL = 'http://localhost:3001/api';

export interface Salon {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface Appointment {
  id: number;
  client_name: string;
  email?: string;
  phone?: string;
  service: string;
  professional?: string;
  date: string;
  time: string;
  observations?: string;
  status: string;
  created_at: string;
  user_id: number;
}

export interface CreateAppointmentData {
  clientName: string;
  email?: string;
  phone?: string;
  service: string;
  professional?: string;
  date: string;
  time: string;
  observations?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get salon information
  async getSalon(salonId: string): Promise<Salon> {
    return this.request<Salon>(`/salon/${salonId}`);
  }

  // Create appointment
  async createAppointment(salonId: string, appointmentData: CreateAppointmentData): Promise<{ message: string; appointment: Appointment }> {
    return this.request(`/appointments/${salonId}`, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  // Get appointments (requires authentication)
  async getAppointments(token: string): Promise<Appointment[]> {
    return this.request<Appointment[]>('/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Update appointment status (requires authentication)
  async updateAppointmentStatus(id: number, status: string, token: string): Promise<{ message: string; appointment: Appointment }> {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  }

  // Delete appointment (requires authentication)
  async deleteAppointment(id: number, token: string): Promise<{ message: string }> {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Register salon (for future use)
  async registerSalon(data: { email: string; password: string; name: string; phone?: string; address?: string; description?: string }) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        salonName: data.name,
        phone: data.phone,
        address: data.address,
        description: data.description
      }),
    });
  }

  // Login salon (for future use)
  async loginSalon(email: string, password: string) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }
}

export const apiService = new ApiService();

// Export individual functions for easier use
export const login = (email: string, password: string) => apiService.loginSalon(email, password);
export const register = (data: { email: string; password: string; name: string; phone?: string; address?: string; description?: string }) => apiService.registerSalon(data);