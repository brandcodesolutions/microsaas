import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Users, CheckCircle, CheckCircle2, XCircle, AlertCircle, Share2, Filter, Trash2, Edit, MoreVertical, RotateCcw, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import TutorialModal from "@/components/TutorialModal";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      fetchAppointments();
    }
  }, [filterStatus, selectedPeriod]);

  useEffect(() => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      fetchAppointments();
    }
  }, [customStartDate, customEndDate]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    console.log('🔄 Iniciando fetchServices...');
    setServicesLoaded(false); // Garantir que está false no início
    
    try {
      console.log('🔐 Verificando autenticação...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        setServicesLoaded(true);
        return;
      }
      
      console.log('👤 Usuário autenticado:', user?.id);
      if (!user) {
        console.log('❌ Usuário não encontrado');
        setServicesLoaded(true);
        return;
      }

      console.log('🏢 Buscando salão do usuário...');
      // Buscar salão do usuário
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (salonError) {
        console.error('❌ Erro ao buscar salão:', salonError);
        setServicesLoaded(true);
        return;
      }

      console.log('🏢 Salão encontrado:', salonData?.id);
      if (!salonData) {
        console.log('❌ Nenhum salão encontrado para o usuário');
        setServicesLoaded(true);
        return;
      }

      console.log('🔍 Buscando serviços do salão...');
      // Buscar serviços do salão
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id);

      if (servicesError) {
        console.error('❌ Erro ao carregar serviços:', servicesError);
        setServicesLoaded(true);
        return;
      }

      console.log('✅ Serviços carregados:', servicesData?.length || 0);
      console.log('📋 Dados dos serviços:', servicesData);
      setServices(servicesData || []);
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar serviços:', error);
    } finally {
      console.log('🏁 fetchServices finalizado, setServicesLoaded(true)');
      setServicesLoaded(true);
    }
  };

  const getServiceName = (serviceId: string): string => {
    if (!servicesLoaded) {
      return 'Carregando serviço...';
    }
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Serviço não encontrado';
  };



  const applyFilters = () => {
    fetchAppointments();
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'all':
      default:
        return null;
    }
    
    return { startDate, endDate };
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
        
      // Aplicar filtro de período
      const dateRange = getDateRange();
      if (dateRange) {
        const startDateStr = dateRange.startDate.toISOString().split('T')[0];
        const endDateStr = dateRange.endDate.toISOString().split('T')[0];
        query = query.gte('appointment_date', startDateStr).lte('appointment_date', endDateStr);
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

      setAppointments(data || []);
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
    if (!confirm(`Tem certeza que deseja excluir o agendamento de ${clientName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao excluir agendamento:', error);
        alert('Erro ao excluir agendamento. Tente novamente.');
        return;
      }

      alert('Agendamento excluído com sucesso!');
      fetchAppointments();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir agendamento. Tente novamente.');
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
    const serviceName = getServiceName(appointment.service_id);
    const message = `Olá ${appointment.client_name}! Seu agendamento está confirmado:\n\n📅 Data: ${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}\n⏰ Horário: ${appointment.appointment_time}\n💇 Serviço: ${serviceName}\n💰 Valor: R$ ${appointment.total_price.toFixed(2)}\n\nNos vemos em breve! 😊`;
    
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
          <div className="flex items-center gap-2">
             <Button
               onClick={() => setShowTutorialModal(true)}
               variant="outline"
               size="sm"
               className="flex items-center gap-2"
             >
               <BookOpen className="h-4 w-4" />
               Tutorial
             </Button>
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
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Period Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Período
                </label>
                <div className="flex flex-wrap bg-gray-100 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => {
                      setSelectedPeriod('today');
                      setShowCustomDatePicker(false);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === 'today'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('week');
                      setShowCustomDatePicker(false);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === 'week'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Esta Semana
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('month');
                      setShowCustomDatePicker(false);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === 'month'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Este Mês
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('all');
                      setShowCustomDatePicker(false);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === 'all'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('custom');
                      setShowCustomDatePicker(true);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === 'custom'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Custom Date Picker */}
              {showCustomDatePicker && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Selecionar Período</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data Inicial</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data Final</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={applyFilters}
                        disabled={!customStartDate || !customEndDate}
                        className="w-full sm:w-auto"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center gap-4">
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
                {selectedPeriod !== 'custom' && (
                  <div className="flex items-end">
                    <Button
                      onClick={applyFilters}
                      className="whitespace-nowrap"
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                )}
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
                  onClick={async () => {
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { data, error } = await supabase
                          .from('salons')
                          .select('id')
                          .eq('owner_id', user.id)
                          .single();
                        
                        if (error) {
                          console.error('Erro ao buscar salão:', error);
                          alert('Erro ao buscar informações do salão.');
                          return;
                        }
                        
                        if (data) {
                          const publicUrl = `${window.location.origin}/agendamento-publico/${data.id}`;
                          window.open(publicUrl, '_blank');
                        } else {
                          alert('Salão não encontrado. Configure seu perfil primeiro.');
                        }
                      } else {
                        alert('Usuário não autenticado.');
                      }
                    } catch (error) {
                      console.error('Erro:', error);
                      alert('Erro ao abrir link de agendamento.');
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
                          {getServiceName(appointment.service_id)}
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
      
      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={showTutorialModal} 
        onClose={() => setShowTutorialModal(false)} 
      />
    </MobileLayout>
  );
};

export default Dashboard;