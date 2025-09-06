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
  const [occupiedTimeSlots, setOccupiedTimeSlots] = useState<any[]>([]);
  
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
      
      let appointments = [];
      
      // Para IDs de teste, usar o UUID real do salão para buscar agendamentos
      let salonIdForQuery = salon.id;
      if (!isValidUUID(salon.id)) {
        // ID de teste - usar o UUID real do salão padrão
        salonIdForQuery = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';

      }
      


      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes, appointment_date, status')
        .eq('salon_id', salonIdForQuery)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
      }

      appointments = appointmentsData || [];
      // Se não há agendamentos, todos os horários deveriam estar disponíveis
      
      const availableTimes = [];
      const serviceDuration = selectedService.duration_minutes;
      
      // Determinar intervalo baseado na duração do serviço
      // Se duração é múltiplo de 30min, usar intervalos de 30min
      // Se duração é múltiplo de 15min, usar intervalos de 15min
      // Caso contrário, usar intervalos de 15min
      let interval = 15;
      if (serviceDuration % 30 === 0) {
        interval = 30;
      } else if (serviceDuration % 15 === 0) {
        interval = 15;
      }
      
      // Gerar slots baseados no intervalo calculado
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotStart = new Date(`2000-01-01T${timeString}:00`);
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
          
          // Verificar se o slot + duração do serviço não ultrapassa 18:00
          if (slotEnd.getHours() > 18 || (slotEnd.getHours() === 18 && slotEnd.getMinutes() > 0)) continue;
          
          // Verificar conflitos com agendamentos existentes
          let hasConflict = false;
          
          for (const appointment of appointments || []) {
            const appointmentStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
            const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);
            

            
            // Verificar sobreposição - dois intervalos se sobrepõem se:
            // NÃO (fim1 <= início2 OU início1 >= fim2)
            // Ou seja, se sobrepõem se: fim1 > início2 E início1 < fim2
            if (slotEnd > appointmentStart && slotStart < appointmentEnd) {
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

  // Função para obter todos os horários ocupados de uma data
  const getOccupiedTimesForDate = async (date: string) => {
    if (!salon?.id) return [];
    
    // Para IDs de teste, usar o UUID real do salão para buscar agendamentos
    let salonIdForQuery = salon.id;
    if (!isValidUUID(salon.id)) {
      // ID de teste - usar o UUID real do salão padrão
      salonIdForQuery = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';
      console.log('🔄 Usando UUID real para buscar horários ocupados:', salonIdForQuery);
    }
    
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('salon_id', salonIdForQuery)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);
      
      if (error) {
        console.error('Erro ao buscar agendamentos ocupados:', error);
        return [];
      }
      
      return appointments || [];
    } catch (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      return [];
    }
  };

  // Função para gerar todos os horários possíveis baseado na duração do serviço
  const getAllPossibleTimes = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService) return [];
    
    const serviceDuration = selectedService.duration_minutes;
    let interval = 15;
    
    if (serviceDuration % 30 === 0) {
      interval = 30;
    } else if (serviceDuration % 15 === 0) {
      interval = 15;
    }
    
    const allTimes = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotStart = new Date(`2000-01-01T${timeString}:00`);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
        
        // Verificar se o slot + duração do serviço não ultrapassa 18:00
        if (slotEnd.getHours() > 18 || (slotEnd.getHours() === 18 && slotEnd.getMinutes() > 0)) continue;
        
        allTimes.push(timeString);
      }
    }
    
    return allTimes;
  };

  // Função para verificar se um horário está ocupado
  const isTimeOccupied = (time: string) => {
    return occupiedTimeSlots.some(appointment => {
      const appointmentStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);
      const slotTime = new Date(`2000-01-01T${time}:00`);
      
      return slotTime >= appointmentStart && slotTime < appointmentEnd;
    });
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
    if (!bookingData.appointmentDate || !bookingData.serviceId) {
      return;
    }
    
    try {
      // Carregar horários disponíveis e ocupados em paralelo
      const [times, occupied] = await Promise.all([
        getAvailableTimesForService(bookingData.appointmentDate, bookingData.serviceId),
        getOccupiedTimesForDate(bookingData.appointmentDate)
      ]);
      

      
      setAvailableTimeSlots(times);
      setOccupiedTimeSlots(occupied);
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
      setError('Erro ao carregar horários disponíveis.');
    }
  };

  const loadSalonData = async () => {
    try {
      // Validar se o salonId é um UUID válido ou um slug válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const slugRegex = /^[a-z0-9-]+$/i; // Aceita qualquer combinação de letras, números e hífens
      
      if (!salonId || (!uuidRegex.test(salonId) && !slugRegex.test(salonId))) {
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

        // Usar dados de teste para desenvolvimento
        const testSalon = {
          id: 'test-salon',
          name: 'Salão de Teste',
          address: 'Rua de Teste, 123',
          phone: '(11) 99999-9999',
          email: 'teste@salon.com',
          description: 'Salão de teste para desenvolvimento'
        };
        setSalon(testSalon);
        
        // Criar serviços de teste
        const testServices = [
          {
            id: 'service-1',
            name: 'Corte de Cabelo',
            price: 50.00,
            duration_minutes: 30,
            description: 'Corte masculino e feminino (30min - intervalos de 30min)'
          },
          {
            id: 'service-2', 
            name: 'Escova',
            price: 30.00,
            duration_minutes: 45,
            description: 'Escova modeladora (45min - intervalos de 15min)'
          },
          {
            id: 'service-3',
            name: 'Coloração',
            price: 120.00,
            duration_minutes: 60,
            description: 'Coloração completa (60min - intervalos de 30min)'
          },
          {
            id: 'service-4',
            name: 'Barba',
            price: 25.00,
            duration_minutes: 15,
            description: 'Aparar barba (15min - intervalos de 15min)'
          }
        ];
        

        setServices(testServices);
        setLoading(false);
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
        // Validar dados dos serviços
        const validServices = (servicesData || []).map(service => {
          return {
            ...service,
            price: service.price || 0,
            duration_minutes: service.duration_minutes || 30
          };
        });
        

        setServices(validServices);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar informações do salão');
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (field: keyof BookingData, value: string) => {
    try {
      setBookingData(prev => {
        const newData = { ...prev, [field]: value };
        return newData;
      });
    } catch (error) {
      console.error('❌ Erro em handleInputChange:', error);
      setError('Erro interno. Tente novamente.');
    }
  };

  // Função para verificar se um ID é um UUID válido
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Buscar informações do serviço para obter duração
      const selectedService = services.find(s => s.id === bookingData.serviceId);
      if (!selectedService) {
        setError('Serviço não encontrado.');
        setSubmitting(false);
        return;
      }

      // Verificar se o horário ainda está disponível
      if (salon?.id) {
        // Para IDs de teste, usar o UUID real do salão para verificar conflitos
        let salonIdForQuery = salon.id;
        if (!isValidUUID(salon.id)) {
          // ID de teste - usar o UUID real do salão padrão
          salonIdForQuery = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';

        }
        
        const { data: existingAppointments, error: checkError } = await supabase
          .from('appointments')
          .select('appointment_time, duration_minutes')
          .eq('salon_id', salonIdForQuery)
          .eq('appointment_date', bookingData.appointmentDate)
          .in('status', ['scheduled', 'confirmed']);

        if (checkError) {
          console.error('Erro ao verificar horários:', checkError);
          setError('Erro ao verificar disponibilidade. Tente novamente.');
          setSubmitting(false);
          return;
        }

        // Verificar sobreposição de horários considerando a duração
        if (existingAppointments && existingAppointments.length > 0) {
          const newAppointmentStart = new Date(`2000-01-01T${bookingData.appointmentTime}:00`);
          const newAppointmentEnd = new Date(newAppointmentStart.getTime() + selectedService.duration_minutes * 60000);

          for (const appointment of existingAppointments) {
            const existingStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
            const existingEnd = new Date(existingStart.getTime() + appointment.duration_minutes * 60000);

            // Verificar sobreposição
            if (
              (newAppointmentStart >= existingStart && newAppointmentStart < existingEnd) ||
              (newAppointmentEnd > existingStart && newAppointmentEnd <= existingEnd) ||
              (newAppointmentStart <= existingStart && newAppointmentEnd >= existingEnd)
            ) {
              setError('Este horário conflita com outro agendamento. Por favor, escolha outro horário.');
              setSubmitting(false);
              return;
            }
          }
        }
      } else {

      }

      // selectedService já foi obtido anteriormente na verificação de conflitos

      // Criar o agendamento (temporariamente sem notes devido ao cache do schema)
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          salon_id: salon?.id,
          service_id: bookingData.serviceId,
          service_name: selectedService.name,
          client_name: bookingData.clientName,
          client_email: bookingData.clientEmail,
          client_phone: bookingData.clientPhone,
          appointment_date: bookingData.appointmentDate,
          appointment_time: bookingData.appointmentTime,
          duration_minutes: selectedService.duration_minutes,
          total_price: selectedService.price,
          status: 'scheduled'
        });
        
      // TODO: Adicionar notes após resolver cache do schema

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
                {!loading ? (
                  <select 
                    id="service"
                    value={bookingData.serviceId} 
                    onChange={(e) => handleInputChange('serviceId', e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Escolha um serviço
                    </option>
                    {services && services.length > 0 ? (
                      services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - R$ {service.price ? service.price.toFixed(2) : '0,00'} ({service.duration_minutes || 0}min)
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        Nenhum serviço disponível
                      </option>
                    )}
                  </select>
                ) : (
                  <div className="p-2 text-center text-gray-500 text-sm">
                    Carregando serviços...
                  </div>
                )}
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
                  {!bookingData.serviceId ? (
                    <div className="p-4 text-center text-gray-500 border rounded-md">
                      Primeiro selecione um serviço
                    </div>
                  ) : !bookingData.appointmentDate ? (
                    <div className="p-4 text-center text-gray-500 border rounded-md">
                      Primeiro selecione uma data
                    </div>
                  ) : !bookingData.serviceId ? (
                    <div className="p-4 text-center text-gray-500 border rounded-md">
                      Primeiro selecione um serviço
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {getAllPossibleTimes(bookingData.serviceId).map((time) => {
                          const isAvailable = availableTimeSlots.includes(time);
                          const isOccupied = isTimeOccupied(time);
                          const isSelected = bookingData.appointmentTime === time;
                          

                          
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => isAvailable ? handleInputChange('appointmentTime', time) : null}
                              disabled={!isAvailable}
                              className={`
                                p-2 text-sm rounded-md border transition-all duration-200
                                ${isSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                  : isAvailable 
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer' 
                                  : isOccupied 
                                  ? 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed' 
                                  : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                }
                              `}
                              title={
                                isSelected 
                                  ? 'Horário selecionado' 
                                  : isAvailable 
                                  ? 'Clique para selecionar este horário' 
                                  : isOccupied 
                                  ? 'Horário ocupado' 
                                  : 'Horário indisponível'
                              }
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{time}</span>
                                <span className="text-xs mt-1">
                                  {isSelected 
                                    ? '✓ Selecionado' 
                                    : isAvailable 
                                    ? '✓ Livre' 
                                    : isOccupied 
                                    ? '✗ Ocupado' 
                                    : '✗ Indisponível'
                                  }
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Legenda */}
                      <div className="mt-4 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                          <span className="text-gray-600">Disponível</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                          <span className="text-gray-600">Ocupado</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
                          <span className="text-gray-600">Indisponível</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-600 rounded"></div>
                          <span className="text-gray-600">Selecionado</span>
                        </div>
                      </div>
                      
                      {availableTimeSlots.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          Nenhum horário disponível para esta data. Tente selecionar outra data.
                        </p>
                      )}
                    </div>
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