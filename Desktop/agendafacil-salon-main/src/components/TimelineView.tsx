import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Share2, CheckCircle, XCircle, Search, Filter, AlertTriangle, Calendar, User, Phone, Mail, MapPin, Plus, Edit3, Trash2, Scissors, Grid, List } from 'lucide-react';

interface Appointment {
  id: string;
  salon_id: string;
  service_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  total_price: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  duration_minutes: number;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  isAvailable: boolean;
  appointments: Appointment[];
}

interface TimelineViewProps {
  appointments: Appointment[];
  services: Service[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onShare: (appointment: Appointment) => void;
  onStatusChange: (appointmentId: string, status: string) => void;
  onCompleteAppointment: (appointmentId: string, totalPrice: number) => void;
  onDeleteAppointment: (appointmentId: string, clientName: string) => void;
  onRescheduleAppointment: (appointmentId: string) => void;
  onReactivateAppointment: (appointmentId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  appointments,
  services,
  selectedDate,
  onDateChange,
  onShare,
  onStatusChange,
  onCompleteAppointment,
  onDeleteAppointment,
  onRescheduleAppointment,
  onReactivateAppointment
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draggedAppointment, setDraggedAppointment] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [isAnimating, setIsAnimating] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Gerar slots de tempo modernos (intervalos de 30 minutos)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          hour,
          minute,
          isAvailable: true,
          appointments: []
        });
      }
    }
    return slots;
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Serviço não encontrado';
  };

  const getServicePrice = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.price_cents / 100 : 0;
  };

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date).toISOString().split('T')[0];
      const selected = new Date(selectedDate).toISOString().split('T')[0];
      const matchesDate = appointmentDate === selected;
      
      const matchesSearch = searchTerm === '' || 
        appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client_phone?.includes(searchTerm) ||
        getServiceName(appointment.service_id).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      
      return matchesDate && matchesSearch && matchesStatus;
    });
  }, [appointments, selectedDate, searchTerm, statusFilter, services]);

  // Gerar slots de tempo e calcular ocupação
  const timeSlots = useMemo(() => {
    const slots = [];
    const occupiedSlots = new Set();
    
    // Primeiro, criar todos os slots
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // Para às 18:00
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          hour,
          minute,
          appointments: [],
          isAvailable: true,
          isOccupiedByPrevious: false
        });
      }
    }
    
    // Depois, processar agendamentos e marcar slots ocupados
    dayAppointments.forEach(appointment => {
      const [appHour, appMinute] = appointment.appointment_time.split(':').map(Number);
      const startSlotIndex = slots.findIndex(slot => slot.hour === appHour && slot.minute === appMinute);
      
      if (startSlotIndex !== -1) {
        const slotsNeeded = Math.ceil(appointment.duration_minutes / 30);
        
        // Marcar o primeiro slot com o agendamento
        slots[startSlotIndex].appointments.push(appointment);
        slots[startSlotIndex].isAvailable = false;
        
        // Marcar slots subsequentes como ocupados
        for (let i = 1; i < slotsNeeded && (startSlotIndex + i) < slots.length; i++) {
          slots[startSlotIndex + i].isAvailable = false;
          slots[startSlotIndex + i].isOccupiedByPrevious = true;
        }
      }
    });
    
    return slots;
  }, [dayAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'from-blue-500 to-blue-600';
      case 'confirmed': return 'from-green-500 to-green-600';
      case 'completed': return 'from-gray-500 to-gray-600';
      case 'cancelled': return 'from-red-500 to-red-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const handleDragStart = (e: React.DragEvent, appointmentId: string) => {
    setDraggedAppointment(appointmentId);
    setIsAnimating(true);
    e.dataTransfer.setData('appointmentId', appointmentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverSlot(null);
    setIsAnimating(false);
  };

  const handleDragOver = (e: React.DragEvent, slotTime: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotTime);
  };

  const handleDrop = (e: React.DragEvent, slotTime: string) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData('appointmentId');
    if (appointmentId && onRescheduleAppointment) {
      console.log(`Reagendar appointment ${appointmentId} para ${slotTime}`);
      // onRescheduleAppointment(appointmentId, slotTime);
    }
    setDragOverSlot(null);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getCurrentTimeIndicator = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour < 8 || currentHour > 18) return null;
    
    const totalMinutes = (currentHour - 8) * 60 + currentMinute;
    const position = (totalMinutes / 30) * 80; // 80px por slot
    
    return position;
  };

  const currentTimePosition = getCurrentTimeIndicator();

  return (
    <div className="space-y-6">
      {/* Header moderno com controles */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Timeline de Agendamentos
                </h2>
                <p className="text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Controles de visualização */}
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
              </div>
              
              {/* Data picker */}
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-white shadow-sm border-gray-200"
              />
            </div>
          </div>
          
          {/* Filtros modernos */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, telefone ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white shadow-sm border-gray-200"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white shadow-sm border-gray-200">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline moderna */}
      {viewMode === 'timeline' ? (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="relative overflow-x-auto" ref={timelineRef}>
              <div className="min-w-[800px] bg-gradient-to-b from-gray-50 to-white">
                {/* Indicador de tempo atual */}
                {currentTimePosition !== null && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 shadow-lg"
                    style={{ top: `${currentTimePosition + 60}px` }}
                  >
                    <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full shadow-lg animate-pulse" />
                    <div className="absolute right-4 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                      Agora
                    </div>
                  </div>
                )}
                
                {/* Header da timeline */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
                  <div className="flex items-center h-16 px-6">
                    <div className="w-20 text-sm font-semibold text-gray-700">
                      Horário
                    </div>
                    <div className="flex-1 text-sm font-semibold text-gray-700">
                      Agendamentos ({dayAppointments.length})
                    </div>
                  </div>
                </div>
                
                {/* Grade de Agendamentos */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Agendamentos do Dia</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dayAppointments.map((appointment) => (
                      <div 
                        key={appointment.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 bg-gradient-to-br ${getStatusColor(appointment.status)} text-white`}
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg truncate">
                              {appointment.client_name}
                            </h4>
                            <p className="text-sm opacity-90 mt-1">
                              {getServiceName(appointment.service_id)}
                            </p>
                          </div>
                          <div className="ml-2 text-right">
                            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                              {getStatusText(appointment.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm opacity-90">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{formatTime(appointment.appointment_time)}</span>
                            <span className="mx-2">•</span>
                            <span>{appointment.duration_minutes}min</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm opacity-90">
                              <User className="w-4 h-4 inline mr-1" />
                              Cliente
                            </div>
                            <div className="text-lg font-bold">
                              R$ {appointment.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Card para adicionar novo agendamento */}
                     <div 
                       className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] text-gray-500 hover:text-blue-600"
                       onClick={() => setShowNewAppointmentModal(true)}
                     >
                       <div className="text-3xl mb-2">+</div>
                       <div className="text-sm font-medium">Novo Agendamento</div>
                       <div className="text-xs mt-1 text-center">Clique para agendar</div>
                     </div>
                  </div>
                  
                  {dayAppointments.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Calendar className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Nenhum agendamento hoje</p>
                        <p className="text-sm mt-2">Clique no botão acima para criar um novo agendamento</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grid View moderna */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dayAppointments.map((appointment) => (
            <Card 
              key={appointment.id} 
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br ${getStatusColor(appointment.status)}`}
              onClick={() => setSelectedAppointment(appointment)}
            >
              <CardContent className="p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-bold text-lg">
                      {formatTime(appointment.appointment_time)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{appointment.client_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm opacity-90">{appointment.client_phone}</span>
                  </div>
                  
                  <div className="text-sm opacity-90">
                    {getServiceName(appointment.service_id)}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/20">
                    <span className="font-bold">R$ {appointment.total_price.toFixed(2)}</span>
                    <span className="text-sm opacity-90">{appointment.duration_minutes}min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {dayAppointments.length === 0 && (
            <div className="col-span-full">
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhum agendamento encontrado
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Não há agendamentos para esta data com os filtros aplicados.
                  </p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalhes do agendamento */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Agendamento
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cliente</label>
                    <p className="text-lg font-semibold">{selectedAppointment.client_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telefone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedAppointment.client_phone}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedAppointment.client_email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Serviço</label>
                    <p className="text-lg font-semibold">{getServiceName(selectedAppointment.service_id)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data e Horário</label>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('pt-BR')} às {formatTime(selectedAppointment.appointment_time)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Duração e Valor</label>
                    <p className="text-lg font-semibold">
                      {selectedAppointment.duration_minutes}min - R$ {selectedAppointment.total_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t">
                <Badge 
                  variant="secondary" 
                  className={`px-3 py-1 bg-gradient-to-r ${getStatusColor(selectedAppointment.status)} text-white`}
                >
                  {getStatusText(selectedAppointment.status)}
                </Badge>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShare(selectedAppointment)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                  
                  {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRescheduleAppointment(selectedAppointment.id)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Reagendar
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDeleteAppointment(selectedAppointment.id, selectedAppointment.client_name);
                      setSelectedAppointment(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineView;