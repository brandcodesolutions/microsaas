import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Users, CheckCircle, CheckCircle2, XCircle, AlertCircle, Share2, Filter, Trash2, Edit, MoreVertical, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, filterStatus]);

  const createTestAppointments = async () => {
    if (!salonId) return;
    
    const testAppointments = [
      {
        salon_id: salonId,
        service_id: 'test-service-1',
        client_name: 'João Silva',
        client_email: 'joao@email.com',
        client_phone: '(11) 99999-1111',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00',
        duration_minutes: 60,
        total_price: 50.00,
        status: 'scheduled' as const,
        notes: 'Corte de cabelo'
      },
      {
        salon_id: salonId,
        service_id: 'test-service-2',
        client_name: 'Maria Santos',
        client_email: 'maria@email.com',
        client_phone: '(11) 99999-2222',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '14:00',
        duration_minutes: 90,
        total_price: 80.00,
        status: 'confirmed' as const,
        notes: 'Corte e escova'
      }
    ];

    try {
      const { error } = await supabase
        .from('appointments')
        .insert(testAppointments);

      if (error) {
        console.error('Erro ao criar agendamentos de teste:', error);
        alert('Erro ao criar agendamentos de teste');
        return;
      }

      alert('Agendamentos de teste criados com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar agendamentos de teste');
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Primeiro, buscar o salão do usuário
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      let currentSalon = salonData;

      if (salonError || !salonData) {
        // Se não encontrou salão, criar um salão de teste para o usuário
        if (salonError?.code === 'PGRST116') {
          const { data: newSalon, error: createError } = await supabase
            .from('salons')
            .insert({
              name: 'Meu Salão',
              owner_id: user.id,
              address: 'Endereço do salão',
              phone: '(11) 99999-9999',
              description: 'Descrição do salão',
              slug: `salao-${user.id.substring(0, 8)}`
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error('Erro ao criar salão:', createError);
            setAppointments([]);
            return;
          }
          
          currentSalon = newSalon;
        } else {
          setAppointments([]);
          return;
        }
      }

      // Armazenar o ID do salão no estado
      setSalonId(currentSalon.id);

      // Buscar agendamentos do salão
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('salon_id', currentSalon.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
        
      // Filtrar por data se selecionada
      if (selectedDate) {
        query = query.eq('appointment_date', selectedDate);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        setAppointments([]);
        return;
      }

      // Filtrar por status se necessário
      let filteredData = data || [];
      if (filterStatus !== 'all') {
        filteredData = filteredData.filter(appointment => appointment.status === filterStatus);
      }

      setAppointments(filteredData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Agendado';
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        return;
      }

      fetchAppointments();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja ocultar o agendamento de ${clientName}? O agendamento será removido da visualização mas os dados financeiros serão preservados.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ hidden: true })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao ocultar agendamento:', error);
        alert('Erro ao ocultar agendamento. Tente novamente.');
        return;
      }

      alert('Agendamento ocultado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao ocultar agendamento. Tente novamente.');
    }
  };

  const handleReactivateAppointment = async (appointmentId: string) => {
    if (!confirm('Deseja reativar este agendamento como agendado?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'scheduled' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao reativar agendamento:', error);
        alert('Erro ao reativar agendamento. Tente novamente.');
        return;
      }

      alert('Agendamento reativado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao reativar agendamento. Tente novamente.');
    }
  };

  const handleRescheduleAppointment = async (appointmentId: string) => {
    const newDate = prompt('Digite a nova data (YYYY-MM-DD):');
    if (!newDate) return;
    
    const newTime = prompt('Digite o novo horário (HH:MM):');
    if (!newTime) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          appointment_date: newDate,
          appointment_time: newTime,
          status: 'scheduled'
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao reagendar agendamento:', error);
        alert('Erro ao reagendar agendamento. Tente novamente.');
        return;
      }

      alert('Agendamento reagendado com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao reagendar agendamento. Tente novamente.');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string, totalPrice: number) => {
    if (!confirm('Confirmar que este agendamento foi concluído?')) {
      return;
    }

    try {
      // Atualizar status do agendamento para concluído
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // Registrar receita no financeiro
      const { error: financialError } = await supabase
        .from('financial_records')
        .insert({
          salon_id: localStorage.getItem('salon_id'),
          type: 'income',
          amount: totalPrice,
          description: `Agendamento concluído - ID: ${appointmentId}`,
          category: 'services',
          date: new Date().toISOString().split('T')[0],
          appointment_id: appointmentId
        });

      if (financialError) {
        console.error('Erro ao registrar no financeiro:', financialError);
        // Mesmo com erro no financeiro, mantém o agendamento como concluído
      }

      // Atualizar a lista de agendamentos
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'completed' as const }
            : apt
        )
      );
      
      alert('Agendamento concluído com sucesso! Receita registrada no financeiro.');
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      alert('Erro ao concluir agendamento. Tente novamente.');
    }
  };

  const handleShare = (appointment: Appointment) => {
    const message = `Olá ${appointment.client_name}! Seu agendamento está confirmado:\n\n📅 Data: ${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}\n⏰ Horário: ${appointment.appointment_time}\n💇 Serviço ID: ${appointment.service_id}\n💰 Valor: R$ ${appointment.total_price.toFixed(2)}\n\nNos vemos em breve! 😊`;
    
    const whatsappUrl = `https://wa.me/${appointment.client_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSharePublicLink = () => {
    if (!salonId) {
      alert('ID do salão não encontrado. Tente recarregar a página.');
      return;
    }
    
    const publicBookingUrl = `${window.location.origin}/agendamento-publico/${salonId}`;
    window.open(publicBookingUrl, '_blank');
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true;
    return appointment.status === filterStatus;
  });

  const getDateStats = () => {
    const total = appointments.length;
    const scheduled = appointments.filter(a => a.status === 'scheduled').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    
    return { total, scheduled, confirmed, completed, cancelled };
  };

  const stats = getDateStats();

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando agendamentos...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Agendamentos</h1>
          </div>
          <Button
            onClick={handleSharePublicLink}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={!salonId}
          >
            <Share2 className="h-4 w-4" />
            Link Público
          </Button>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Data
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={createTestAppointments}
                  variant="outline"
                  className="whitespace-nowrap"
                  disabled={!salonId}
                >
                  Criar Teste
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.scheduled}</div>
              <div className="text-sm text-gray-600">Agendado</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Concluído</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-gray-600">Cancelado</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  {filterStatus === 'all' 
                    ? 'Não há agendamentos para esta data.'
                    : `Não há agendamentos com status "${getStatusText(filterStatus)}" para esta data.`
                  }
                </p>
                <Button
                  onClick={() => {
                    const { data: { user } } = supabase.auth.getUser();
                    if (user) {
                      supabase.from('salons').select('id').eq('owner_id', user.id).single()
                        .then(({ data }) => {
                          if (data) {
                            const publicUrl = `${window.location.origin}/agendamento-publico/${data.id}`;
                            window.open(publicUrl, '_blank');
                          }
                        });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Agendar Online
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {appointment.client_name}
                        </h3>
                        <Badge variant={getStatusVariant(appointment.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(appointment.status)}
                            {getStatusText(appointment.status)}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {appointment.appointment_time}
                        </div>
                        <div className="font-medium text-blue-600">
                          Serviço ID: {appointment.service_id}
                        </div>
                        <div className="font-semibold text-green-600">
                          R$ {appointment.total_price.toFixed(2)}
                        </div>
                        {appointment.client_phone && (
                          <div className="text-gray-500">
                            {appointment.client_phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {appointment.client_phone && (
                        <Button
                          onClick={() => handleShare(appointment)}
                          size="sm"
                          variant="outline"
                          className="p-2 h-8 w-8"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                  
                  {/* Status Actions */}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button
                          onClick={() => handleCompleteAppointment(appointment.id, appointment.total_price)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluído
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => handleDeleteAppointment(appointment.id, appointment.client_name)}
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <>
                        <Button
                          onClick={() => handleCompleteAppointment(appointment.id, appointment.total_price)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluir
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => handleDeleteAppointment(appointment.id, appointment.client_name)}
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </>
                    )}
                    {appointment.status === 'completed' && (
                      <>
                        <Button
                          onClick={() => handleReactivateAppointment(appointment.id)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Reativar
                        </Button>
                        <Button
                          onClick={() => handleDeleteAppointment(appointment.id, appointment.client_name)}
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </>
                    )}
                    {appointment.status === 'cancelled' && (
                      <>
                        <Button
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Reagendar
                        </Button>
                        <Button
                          onClick={() => handleDeleteAppointment(appointment.id, appointment.client_name)}
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>


      </div>
    </MobileLayout>
  );
};

export default Dashboard;