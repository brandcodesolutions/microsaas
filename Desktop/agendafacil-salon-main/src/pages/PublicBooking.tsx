import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Phone, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Salon {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
}

interface BookingData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export default function PublicBooking() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: ""
  });

  // Horários disponíveis (9h às 18h)
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // Função para verificar disponibilidade de datas
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Assumindo que o salão funciona de segunda a sábado (1-6)
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  // Função para calcular horários disponíveis considerando duração do serviço
  const getAvailableTimesForService = async (date: string, serviceId: string) => {
    if (!salon?.id || !serviceId) return [];
    
    try {
      // Buscar informações do serviço selecionado
      const selectedService = services.find(s => s.id === serviceId);
      if (!selectedService) return [];
      
      // Buscar agendamentos existentes para a data
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('salon_id', salon.id)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);
      
      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
      }
      
      const availableTimes = [];
      const serviceDuration = selectedService.duration_minutes;
      
      // Gerar slots de 15 minutos
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotStart = new Date(`2000-01-01T${timeString}:00`);
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
          
          // Verificar se o slot + duração do serviço não ultrapassa 18:00
          if (slotEnd.getHours() > 18) continue;
          
          // Verificar conflitos com agendamentos existentes
          let hasConflict = false;
          
          for (const appointment of appointments || []) {
            const appointmentStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
            const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);
            
            // Verificar sobreposição
            if (
              (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
              (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
              (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
            ) {
              hasConflict = true;
              break;
            }
          }
          
          if (!hasConflict) {
            availableTimes.push(timeString);
          }
        }
      }
      
      return availableTimes;
    } catch (error) {
      console.error('Erro ao calcular horários disponíveis:', error);
      return [];
    }
  };

  useEffect(() => {
    if (salonId) {
      loadSalonData();
    }
  }, [salonId]);

  useEffect(() => {
    if (bookingData.appointmentDate && bookingData.serviceId) {
      loadAvailableTimeSlots();
    } else {
      setAvailableTimeSlots([]);
    }
  }, [bookingData.appointmentDate, bookingData.serviceId, salon?.id]);

  const loadAvailableTimeSlots = async () => {
    if (!bookingData.appointmentDate || !bookingData.serviceId) return;
    
    const times = await getAvailableTimesForService(bookingData.appointmentDate, bookingData.serviceId);
    setAvailableTimeSlots(times);
  };

  const loadSalonData = async () => {
    try {
      // Validar se o salonId é um UUID válido ou um slug válido (salon-uuid)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const slugRegex = /^salon-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(salonId) && !slugRegex.test(salonId)) {
        console.log('⚠️ ID de salão inválido:', salonId);
        setError('ID de salão inválido');
        return;
      }

      // Carregar dados do salão (buscar por slug se for slug, por id se for UUID)
      const isSlug = slugRegex.test(salonId);
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq(isSlug ? 'slug' : 'id', salonId)
        .single();

      if (salonError) {
        setError('Salão não encontrado');
        return;
      }

      setSalon(salonData);

      // Carregar serviços do salão (sempre usar o id real do salão)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id);

      if (servicesError) {
        console.error('Erro ao carregar serviços:', servicesError);
      } else {
        setServices(servicesData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar informações do salão');
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (field: keyof BookingData, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Verificar se o horário ainda está disponível
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('salon_id', salon?.id)
        .eq('appointment_date', bookingData.appointmentDate)
        .eq('appointment_time', bookingData.appointmentTime)
        .in('status', ['scheduled', 'confirmed'])
        .single();

      if (existingAppointment) {
        setError('Este horário já foi ocupado. Por favor, escolha outro horário.');
        setSubmitting(false);
        return;
      }

      // Buscar informações do serviço para obter duração e preço
      const selectedService = services.find(s => s.id === bookingData.serviceId);
      if (!selectedService) {
        setError('Serviço não encontrado.');
        setSubmitting(false);
        return;
      }

      // Criar o agendamento
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          salon_id: salon?.id,
          service_id: bookingData.serviceId,
          client_name: bookingData.clientName,
          client_email: bookingData.clientEmail,
          client_phone: bookingData.clientPhone,
          appointment_date: bookingData.appointmentDate,
          appointment_time: bookingData.appointmentTime,
          duration_minutes: selectedService.duration_minutes,
          total_price: selectedService.price,
          notes: bookingData.notes,
          status: 'scheduled'
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      
      // Limpar formulário após 3 segundos
      setTimeout(() => {
        setBookingData({
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          serviceId: "",
          appointmentDate: "",
          appointmentTime: "",
          notes: ""
        });
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setError('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return bookingData.clientName && 
           bookingData.clientEmail && 
           bookingData.clientPhone && 
           bookingData.serviceId && 
           bookingData.appointmentDate && 
           bookingData.appointmentTime;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento Confirmado!</h2>
            <p className="text-gray-600 mb-4">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
            </p>
            <Button onClick={() => setSuccess(false)}>
              Fazer Novo Agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header do Salão */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">{salon?.name}</CardTitle>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 text-gray-600">
              {salon?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{salon.address}</span>
                </div>
              )}
              {salon?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{salon.phone}</span>
                </div>
              )}
              {salon?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{salon.email}</span>
                </div>
              )}
            </div>
            {salon?.description && (
              <p className="text-gray-600 mt-4">{salon.description}</p>
            )}
          </CardHeader>
        </Card>

        {/* Formulário de Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendar Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Nome Completo *</Label>
                  <Input
                    id="clientName"
                    value={bookingData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Telefone *</Label>
                  <Input
                    id="clientPhone"
                    value={bookingData.clientPhone}
                    onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={bookingData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {/* Seleção de Serviço */}
              <div>
                <Label htmlFor="service">Serviço *</Label>
                <Select value={bookingData.serviceId} onValueChange={(value) => handleInputChange('serviceId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointmentDate">Data *</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={bookingData.appointmentDate}
                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                    min={getMinDate()}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="appointmentTime">Horário *</Label>
                  <Select 
                    value={bookingData.appointmentTime} 
                    onValueChange={(value) => handleInputChange('appointmentTime', value)}
                    disabled={!bookingData.appointmentDate || !bookingData.serviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !bookingData.serviceId 
                          ? "Primeiro selecione um serviço" 
                          : !bookingData.appointmentDate 
                          ? "Primeiro selecione uma data" 
                          : availableTimeSlots.length === 0 
                          ? "Nenhum horário disponível" 
                          : "Escolha um horário"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                      {availableTimeSlots.length === 0 && bookingData.serviceId && bookingData.appointmentDate && (
                        <div className="p-2 text-center text-gray-500 text-sm">
                          Nenhum horário disponível para esta data
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {bookingData.serviceId && bookingData.appointmentDate && availableTimeSlots.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Tente selecionar outra data ou outro serviço
                    </p>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={bookingData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Alguma observação especial?"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!isFormValid() || submitting}
              >
                {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}