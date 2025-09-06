import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, Users, Download, Filter } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface FinancialData {
  totalRevenue: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageTicket: number;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
}

interface ServiceData {
  name: string;
  count: number;
  revenue: number;
}

const Financeiro = () => {
  const [data, setData] = useState<FinancialData>({
    totalRevenue: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averageTicket: 0
  });
  const [revenueChartData, setRevenueChartData] = useState<ChartData[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);
  
  useEffect(() => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      loadFinancialData();
    }
  }, [customStartDate, customEndDate]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();

      if (!profile?.salon_id) return;

      const { data: salon } = await supabase
        .from('salons')
        .select('*')
        .eq('id', profile.salon_id)
        .single();

      if (!salon) return;

      // Calculate date range based on selected period
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (selectedPeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
          } else {
            startDate.setMonth(now.getMonth() - 1);
          }
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
      }

      // Get appointments data with service names
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services (name, price)
        `)
        .eq('salon_id', salon.id)
        .gte('appointment_date', startDate.toISOString().split('T')[0]);
      
      // Add end date filter for today and custom periods
      if (selectedPeriod === 'today' || selectedPeriod === 'custom') {
        query = query.lte('appointment_date', endDate.toISOString().split('T')[0]);
      }
      
      const { data: appointments } = await query;

      if (appointments) {
        const completed = appointments.filter(apt => apt.status === 'completed');
        const cancelled = appointments.filter(apt => apt.status === 'cancelled');
        
        const totalRevenue = completed.reduce((sum, apt) => {
          return sum + (apt.total_price || 0);
        }, 0);

        const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

        // Generate revenue chart data
        const revenueByPeriod = generateRevenueChartData(completed, selectedPeriod);
        setRevenueChartData(revenueByPeriod);

        // Generate services data
        const servicesStats = generateServicesData(completed);
        setServicesData(servicesStats);

        setData({
          totalRevenue,
          completedAppointments: completed.length,
          cancelledAppointments: cancelled.length,
          averageTicket
        });
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRevenueChartData = (appointments: any[], period: string): ChartData[] => {
    const groupedData: { [key: string]: number } = {};
    
    // Initialize with empty data points to ensure chart shows properly
    const now = new Date();
    
    switch (period) {
      case 'today':
        // Show hourly data for today
        for (let i = 8; i <= 20; i++) {
          groupedData[`${i}:00`] = 0;
        }
        break;
      case 'week':
        // Show last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const key = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          groupedData[key] = 0;
        }
        break;
      case 'month':
        // Show last 30 days (grouped by week)
        for (let i = 3; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          const key = `Sem ${4 - i}`;
          groupedData[key] = 0;
        }
        break;
      case 'year':
        // Show last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          const key = date.toLocaleDateString('pt-BR', { month: 'short' });
          groupedData[key] = 0;
        }
        break;
      case 'custom':
        // For custom period, group by days if <= 30 days, otherwise by weeks
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          // Group by days
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            groupedData[key] = 0;
          }
        } else {
          // Group by weeks
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
            const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            groupedData[key] = 0;
          }
        }
        break;
    }
    
    // Now add actual appointment data
    appointments.forEach(apt => {
      const date = new Date(apt.appointment_date);
      let key = '';
      
      switch (period) {
        case 'today':
          const hour = date.getHours();
          key = `${hour}:00`;
          break;
        case 'week':
          key = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          break;
        case 'month':
          // Group by week number
          const weeksDiff = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
          key = `Sem ${Math.max(1, 4 - weeksDiff)}`;
          break;
        case 'year':
          key = date.toLocaleDateString('pt-BR', { month: 'short' });
          break;
        case 'custom':
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30) {
            key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          } else {
            // Find the week this date belongs to
            const weekStart = new Date(startDate);
            while (weekStart <= date) {
              if (date >= weekStart && date < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                key = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                break;
              }
              weekStart.setDate(weekStart.getDate() + 7);
            }
          }
          break;
      }
      
      if (key && groupedData.hasOwnProperty(key)) {
        groupedData[key] += (apt.total_price || 0);
      }
    });
    
    return Object.entries(groupedData).map(([name, value]) => ({ name, value }));
  };

  const generateServicesData = (appointments: any[]): ServiceData[] => {
    const servicesMap: { [key: string]: { count: number; revenue: number } } = {};
    
    appointments.forEach(apt => {
      if (apt.services?.name) {
        const serviceName = apt.services.name;
        if (!servicesMap[serviceName]) {
          servicesMap[serviceName] = { count: 0, revenue: 0 };
        }
        servicesMap[serviceName].count++;
        servicesMap[serviceName].revenue += (apt.total_price || 0);
      }
    });
    
    return Object.entries(servicesMap)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const periodLabels = {
    today: 'Hoje',
    week: 'Última semana',
    month: 'Último mês',
    year: 'Último ano',
    custom: 'Período personalizado'
  };

  return (
    <MobileLayout>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-gray-600">Acompanhe o desempenho do seu salão</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Period Filter */}
            <div className="flex flex-wrap bg-gray-100 rounded-lg p-1">
              {Object.entries(periodLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPeriod(key);
                    if (key === 'custom') {
                      setShowCustomDatePicker(true);
                    } else {
                      setShowCustomDatePicker(false);
                    }
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedPeriod === key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Selecionar Período</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Final</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => loadFinancialData()}
                  disabled={!customStartDate || !customEndDate}
                  className="w-full sm:w-auto"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Financial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Faturamento Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? "..." : formatCurrency(data.totalRevenue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {periodLabels[selectedPeriod as keyof typeof periodLabels]}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Agendamentos Concluídos
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? "..." : data.completedAppointments}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {periodLabels[selectedPeriod as keyof typeof periodLabels]}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ticket Médio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {isLoading ? "..." : formatCurrency(data.averageTicket)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Por agendamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cancelamentos
              </CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? "..." : data.cancelledAppointments}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {periodLabels[selectedPeriod as keyof typeof periodLabels]}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Faturamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                      <p>Carregando...</p>
                    </div>
                  </div>
                ) : revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Serviços Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                      <p>Carregando...</p>
                    </div>
                  </div>
                ) : servicesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name} (${count})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {servicesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, 'Agendamentos']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" className="h-12">
                <Download className="w-4 h-4 mr-2" />
                Relatório PDF
              </Button>
              <Button variant="outline" className="h-12">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline" className="h-12">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Financeiro;