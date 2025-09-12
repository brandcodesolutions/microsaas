import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
}

interface Salon {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  whatsapp?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingFormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
}

const PublicBooking: React.FC = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [step, setStep] = useState<'service' | 'datetime' | 'form' | 'confirmation'>('service');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [formData, setFormData] = useState<BookingFormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  // Gerar slots de tempo baseados na duração do serviço selecionado
  const generateTimeSlots = (serviceDuration: number = 30): string[] => {
    const slots: string[] = [];
    const interval = serviceDuration;
    
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const totalMinutes = hour * 60 + minute;
        const endTotalMinutes = totalMinutes + serviceDuration;
        const endHour = Math.floor(endTotalMinutes / 60);
        
        if (endHour > 18) break;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = useMemo(() => {
    return generateTimeSlots(selectedService?.duration_minutes || 30);
  }, [selectedService?.duration_minutes]);

  // Gerar datas da semana atual + próximas semanas
  const getWeekDates = (weekOffset: number = 0): Date[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + (weekOffset * 7));
    
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  // Carregar dados do salão
  useEffect(() => {
    const loadSalonData = async () => {
      try {
        const { data: salonData, error: salonError } = await supabase
          .from('salons')
          .select('*')
          .eq('id', salonId)
          .single();

        if (salonError) {
          console.error('Erro ao buscar salão:', salonError);
          toast.error('Salão não encontrado');
          return;
        }

        setSalon(salonData);

        // Buscar serviços do salão
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', salonId)
          .order('name');

        if (servicesError) {
          console.error('Erro ao buscar serviços:', servicesError);
          toast.error('Erro ao carregar serviços');
          return;
        }

        setServices(servicesData || []);
      } catch (error) {
        console.error('Erro geral:', error);
        toast.error('Erro ao carregar dados do salão');
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      loadSalonData();
    }
  }, [salonId]);

  // Carregar slots disponíveis quando data e serviço são selecionados
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots(selectedDate, selectedService.id);
    }
  }, [selectedDate, selectedService]);

  const loadAvailableSlots = async (date: string, serviceId: string) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes, status')
        .eq('salon_id', salonId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      const currentServiceDuration = selectedService?.duration_minutes || 30;
      
      const hasConflict = (newStart: number, newDuration: number, existingStart: number, existingDuration: number): boolean => {
        const newEnd = newStart + newDuration;
        const existingEnd = existingStart + existingDuration;
        return (newStart < existingEnd && newEnd > existingStart);
      };

      const slots: TimeSlot[] = timeSlots.map(time => {
        const [hour, minute] = time.split(':').map(Number);
        const slotStartMinutes = hour * 60 + minute;
        
        const isAvailable = !appointments?.some(appointment => {
          const [appHour, appMinute] = appointment.appointment_time.split(':').map(Number);
          const appStartMinutes = appHour * 60 + appMinute;
          const appDuration = appointment.duration_minutes || 30;
          
          return hasConflict(slotStartMinutes, currentServiceDuration, appStartMinutes, appDuration);
        });
        
        return {
          time,
          available: isAvailable
        };
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
      setAvailableSlots(timeSlots.map(time => ({ time, available: true })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.client_email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }
    if (!formData.client_phone.trim()) {
      toast.error('Telefone é obrigatório');
      return;
    }
    if (!formData.service_id) {
      toast.error('Serviço não selecionado');
      return;
    }
    if (!formData.appointment_date) {
      toast.error('Data não selecionada');
      return;
    }
    if (!formData.appointment_time) {
      toast.error('Horário não selecionado');
      return;
    }
    
    setSubmitting(true);

    try {
      if (!salon || !selectedService) {
        throw new Error('Dados do salão ou serviço não disponíveis');
      }

      const appointmentData = {
        salon_id: salon.id,
        service_id: formData.service_id,
        service_name: selectedService.name,
        client_name: formData.client_name.trim(),
        client_email: formData.client_email.trim(),
        client_phone: formData.client_phone.trim(),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        duration_minutes: selectedService.duration_minutes || 30,
        total_price: selectedService.price_cents / 100,
        status: 'scheduled',
        notes: formData.notes?.trim() || null
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();

      if (error) {
        console.error('Erro do Supabase:', error);
        toast.error(`Erro no banco: ${error.message}`);
        return;
      }

      console.log('Agendamento criado com sucesso:', data);
      setStep('confirmation');
      toast.success('Agendamento realizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao realizar agendamento:', error);
      toast.error('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando...</h3>
            <p className="text-gray-600">Preparando seu agendamento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header do Salão */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{salon?.name}</h1>
                <p className="text-indigo-100 mb-4">{salon?.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {salon?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{salon.address}</span>
                    </div>
                  )}
                  {salon?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{salon.phone}</span>
                    </div>
                  )}
                  {salon?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{salon.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-indigo-100">4.9 (127 avaliações)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicador de Progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${step === 'service' ? 'text-indigo-600' : step === 'datetime' || step === 'form' || step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'service' ? 'bg-indigo-600 text-white' : 
                step === 'datetime' || step === 'form' || step === 'confirmation' ? 'bg-green-600 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="font-medium">Serviço</span>
            </div>
            
            <div className={`flex items-center gap-2 ${step === 'datetime' ? 'text-indigo-600' : step === 'form' || step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'datetime' ? 'bg-indigo-600 text-white' : 
                step === 'form' || step === 'confirmation' ? 'bg-green-600 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Data & Hora</span>
            </div>
            
            <div className={`flex items-center gap-2 ${step === 'form' ? 'text-indigo-600' : step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'form' ? 'bg-indigo-600 text-white' : 
                step === 'confirmation' ? 'bg-green-600 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="font-medium">Dados</span>
            </div>
            
            <div className={`flex items-center gap-2 ${step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                4
              </div>
              <span className="font-medium">Confirmação</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: step === 'service' ? '25%' : 
                       step === 'datetime' ? '50%' : 
                       step === 'form' ? '75%' : '100%' 
              }}
            />
          </div>
        </div>

        {/* Etapa 1: Seleção de Serviço */}
        {step === 'service' && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Escolha seu serviço</h2>
              
              {services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum serviço disponível no momento.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setFormData(prev => ({ ...prev, service_id: service.id }));
                        setStep('datetime');
                      }}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 mb-2">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-gray-600 mb-3">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{service.duration_minutes} min</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-600">
                            R$ {(service.price_cents / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Seleção de Data e Hora */}
        {step === 'datetime' && selectedService && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Escolha data e horário</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('service')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </div>
              
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">Serviço selecionado:</h3>
                <p className="text-indigo-800">{selectedService.name}</p>
                <p className="text-sm text-indigo-600">
                  {selectedService.duration_minutes} min • R$ {(selectedService.price_cents / 100).toFixed(2)}
                </p>
              </div>

              {/* Seletor de Semana */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                  disabled={currentWeek === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Semana Anterior
                </Button>
                
                <span className="font-medium text-gray-700">
                  {weekDates[0]?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentWeek(currentWeek + 1)}
                  className="flex items-center gap-2"
                >
                  Próxima Semana
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendário de Dias */}
              <div className="grid grid-cols-7 gap-2 mb-8">
                {weekDates.map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateString;
                  const isPast = isPastDate(date);
                  const todayClass = isToday(date) ? 'ring-2 ring-indigo-400' : '';
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isPast) {
                          setSelectedDate(dateString);
                          setFormData(prev => ({ ...prev, appointment_date: dateString }));
                        }
                      }}
                      disabled={isPast}
                      className={`h-20 flex flex-col items-center justify-center ${todayClass} ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : isPast
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-300'
                      } rounded-lg transition-all duration-200`}
                    >
                      <span className="text-xs font-medium">
                        {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-bold">
                        {date.getDate()}
                      </span>
                      <span className="text-xs">
                        {date.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Horários Disponíveis */}
              {selectedDate && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Horários disponíveis para {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  </h3>
                  
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
                      <p className="text-gray-600">Carregando horários...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => {
                            if (slot.available) {
                              setFormData(prev => ({ ...prev, appointment_time: slot.time }));
                              setStep('form');
                            }
                          }}
                          disabled={!slot.available}
                          className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            slot.available
                              ? 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-900'
                              : 'bg-gray-100 border-2 border-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Formulário de Dados */}
        {step === 'form' && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Seus dados</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('datetime')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </div>
              
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Resumo do agendamento:</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Serviço:</strong> {selectedService?.name}</p>
                  <p><strong>Data:</strong> {new Date(formData.appointment_date).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horário:</strong> {formData.appointment_time}</p>
                  <p><strong>Duração:</strong> {selectedService?.duration_minutes} min</p>
                  <p><strong>Valor:</strong> R$ {selectedService ? (selectedService.price_cents / 100).toFixed(2) : '0,00'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Nome completo *</Label>
                    <Input
                      id="client_name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                      required
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client_phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="client_phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.client_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_email">E-mail *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.client_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                    required
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Alguma observação especial para seu atendimento?"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-white"
                    rows={3}
                  />
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setStep('datetime')}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4: Confirmação */}
        {step === 'confirmation' && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agendamento Confirmado!</h2>
              <p className="text-gray-600 mb-8">Seu agendamento foi realizado com sucesso. Você receberá uma confirmação por e-mail e WhatsApp.</p>
              
              <Card className="bg-green-50 border-green-200 mb-8">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-green-900 mb-4">Detalhes do seu agendamento</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <p><strong>Salão:</strong> {salon?.name || 'N/A'}</p>
                    <p><strong>Serviço:</strong> {selectedService?.name || 'N/A'}</p>
                    <p><strong>Data:</strong> {formData.appointment_date ? new Date(formData.appointment_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p><strong>Horário:</strong> {formData.appointment_time || 'N/A'}</p>
                    <p><strong>Cliente:</strong> {formData.client_name || 'N/A'}</p>
                    <p><strong>Telefone:</strong> {formData.client_phone || 'N/A'}</p>
                    <p><strong>Valor:</strong> R$ {selectedService && selectedService.price_cents ? (selectedService.price_cents / 100).toFixed(2) : '0,00'}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Chegue com 10 minutos de antecedência. Em caso de cancelamento, entre em contato com pelo menos 2 horas de antecedência.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep('service');
                    setSelectedService(null);
                    setSelectedDate('');
                    setFormData({
                      client_name: '',
                      client_email: '',
                      client_phone: '',
                      service_id: '',
                      appointment_date: '',
                      appointment_time: '',
                      notes: ''
                    });
                  }}
                  className="flex-1"
                >
                  Fazer Novo Agendamento
                </Button>
                <Button 
                  onClick={() => window.close()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;