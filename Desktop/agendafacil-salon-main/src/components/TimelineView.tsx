import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Share2, CheckCircle, XCircle } from 'lucide-react';

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
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Serviço não encontrado';
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const dayAppointments = appointments.filter(
    appointment => {
      // Normalizar as datas para comparação
      const appointmentDate = new Date(appointment.appointment_date).toISOString().split('T')[0];
      const selected = new Date(selectedDate).toISOString().split('T')[0];
      return appointmentDate === selected;
    }
  );

  const getAppointmentPosition = (appointment: Appointment) => {
    const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
    const startMinutes = (hours - 8) * 60 + minutes;
    const top = (startMinutes / 30) * 60; // Cada slot de 30min tem 60px
    const height = Math.max((appointment.duration_minutes / 30) * 60, 60); // Altura mínima de 60px
    return { top, height };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selecionar Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="relative">

            <div className="relative" style={{ height: `${timeSlots.length * 60}px` }}>
              {timeSlots.map((time, index) => (
                <div
                  key={time}
                  className="absolute left-0 right-0 border-t border-gray-200 flex items-center"
                  style={{ top: `${index * 60}px`, height: '60px' }}
                >
                  <div className="w-16 text-sm text-gray-500 font-medium px-3">
                    {time}
                  </div>
                  <div className="flex-1 h-full relative">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
                  </div>
                </div>
              ))}

              {dayAppointments.map((appointment) => {
                const { top, height } = getAppointmentPosition(appointment);
                const statusColor = getStatusColor(appointment.status);
                
                return (
                  <div
                    key={appointment.id}
                    className={`absolute left-20 right-4 ${statusColor} text-white rounded-lg shadow-md overflow-hidden`}
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 60)}px`,
                      zIndex: 10
                    }}
                  >
                    <div className="p-2 h-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {appointment.appointment_time}
                        </span>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                      <button 
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                      >
                        Ver mais
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {dayAppointments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum agendamento para esta data</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {dayAppointments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-800 mb-4">Detalhes dos Agendamentos</h4>
            <div className="space-y-3">
              {dayAppointments
                .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{appointment.client_name}</span>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(appointment.status)} text-white border-0`}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{appointment.appointment_time} - {getServiceName(appointment.service_id)}</div>
                        <div>R$ {appointment.total_price.toFixed(2)} • {appointment.duration_minutes}min</div>
                        {appointment.client_phone && (
                          <div className="text-gray-500">{appointment.client_phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {appointment.client_phone && (
                        <Button
                          onClick={() => onShare(appointment)}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            onClick={() => onCompleteAppointment(appointment.id, appointment.total_price)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => onStatusChange(appointment.id, 'cancelled')}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para exibir detalhes do agendamento */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Cliente</label>
                  <p className="text-sm font-semibold">{selectedAppointment.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {getStatusText(selectedAppointment.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Data</label>
                  <p className="text-sm">{new Date(selectedAppointment.appointment_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Horário</label>
                  <p className="text-sm">{selectedAppointment.appointment_time}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Serviço</label>
                <p className="text-sm">{getServiceName(selectedAppointment.service_id)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Duração</label>
                  <p className="text-sm">{selectedAppointment.duration_minutes} minutos</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor</label>
                  <p className="text-sm font-semibold">R$ {selectedAppointment.total_price.toFixed(2)}</p>
                </div>
              </div>

              {selectedAppointment.client_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Telefone</label>
                  <p className="text-sm">{selectedAppointment.client_phone}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Observações</label>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                 {selectedAppointment.status === 'agendado' && (
                   <>
                     <Button
                       onClick={() => {
                         onConfirmAppointment(selectedAppointment.id);
                         setSelectedAppointment(null);
                       }}
                       className="flex-1 bg-green-600 hover:bg-green-700"
                       size="sm"
                     >
                       <CheckCircle className="w-4 h-4 mr-1" />
                       Confirmar
                     </Button>
                     <Button
                       onClick={() => {
                         onCancelAppointment(selectedAppointment.id);
                         setSelectedAppointment(null);
                       }}
                       variant="destructive"
                       className="flex-1"
                       size="sm"
                     >
                       <XCircle className="w-4 h-4 mr-1" />
                       Cancelar
                     </Button>
                   </>
                 )}
                 {selectedAppointment.status === 'cancelado' && (
                   <Button
                     onClick={() => {
                       onReactivateAppointment(selectedAppointment.id);
                       setSelectedAppointment(null);
                     }}
                     className="flex-1 bg-blue-600 hover:bg-blue-700"
                     size="sm"
                   >
                     Reativar
                   </Button>
                 )}
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineView;