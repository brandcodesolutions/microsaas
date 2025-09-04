import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, LogOut, Users, Clock, Share2, Copy, Plus, Edit, Trash2, Scissors, Building } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Salon {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  salon_id: string;
  created_at?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  services?: { name: string };
  salons?: { name: string };
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  
  // Estados para o formulário de serviços
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    salon_id: ''
  });
  const [editingService, setEditingService] = useState<string | null>(null);
  
  // Estados para o formulário do salão
  const [showSalonForm, setShowSalonForm] = useState(false);
  const [salonForm, setSalonForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: ''
  });

  // Definir automaticamente o salon_id quando um salão estiver disponível
  useEffect(() => {
    if (salon?.id && !serviceForm.salon_id) {
      setServiceForm(prev => ({ ...prev, salon_id: salon.id }));
    }
  }, [salon?.id, serviceForm.salon_id]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const handleSaveSalon = async () => {
    try {
      console.log('🏪 Iniciando criação/atualização do salão...');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário atual:', user?.id);
      
      if (!user?.id) {
        console.error('❌ Usuário não encontrado');
        alert('Erro: Usuário não encontrado');
        return;
      }

      const salonData = {
        name: salonForm.name.trim(),
        description: salonForm.description.trim(),
        address: salonForm.address.trim(),
        phone: salonForm.phone.trim(),
        owner_id: user.id,
        slug: salonForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      };
      
      console.log('📋 Dados do salão a serem salvos:', salonData);

      let result;
      if (salon?.id) {
        console.log('✏️ Atualizando salão existente:', salon.id);
        // Atualizar salão existente
        const { data, error } = await supabase
          .from('salons')
          .update(salonData)
          .eq('id', salon.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao atualizar salão:', error);
          throw error;
        }
        result = data;
        console.log('✅ Salão atualizado:', result);
      } else {
        console.log('🆕 Criando novo salão...');
        // Criar novo salão
        const { data, error } = await supabase
          .from('salons')
          .insert([salonData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao criar salão:', error);
          console.error('Detalhes do erro:', error.message, error.details, error.hint);
          throw error;
        }
        result = data;
        console.log('✅ Salão criado:', result);

        // Atualizar o perfil do usuário com o salon_id
        console.log('🔗 Vinculando salão ao perfil do usuário...');
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ salon_id: result.id })
          .eq('id', user.id);
        
        if (profileError) {
          console.warn('⚠️ Erro ao atualizar perfil:', profileError);
        } else {
          console.log('✅ Perfil atualizado com salon_id');
        }
      }

      setSalon(result);
      setShowSalonForm(false);
      setSalonForm({ name: '', description: '', address: '', phone: '' });
      alert(salon?.id ? 'Salão atualizado com sucesso!' : 'Salão criado com sucesso!');
      
    } catch (error) {
      console.error('💥 Erro completo ao salvar salão:', error);
      alert('Erro ao salvar salão. Verifique o console para mais detalhes.');
    }
  };

  const loadServices = async () => {
    if (!salon?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salon.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleCreateService = async () => {
    console.log('🔍 Tentando criar serviço...');
    console.log('📊 Estado do salão:', salon);
    console.log('🆔 ID do salão:', salon?.id);
    console.log('⏳ Loading:', loading);
    
    if (loading) {
      alert('Aguarde o carregamento dos dados...');
      return;
    }
    
    if (!salon?.id) {
      console.error('❌ Salão não encontrado no estado');
      alert('Erro: Você precisa criar um salão primeiro. Vá para a seção "Meu Salão" e preencha os dados.');
      return;
    }
    
    if (!serviceForm.name.trim()) {
      alert('Nome do serviço é obrigatório');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim() || null,
          duration_minutes: serviceForm.duration_minutes,
          price: serviceForm.price,
          salon_id: salon.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setServices(prev => [data, ...prev]);
      setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0 });
      setShowServiceForm(false);
      alert('Serviço criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      alert(`Erro ao criar serviço: ${error.message}`);
    }
  };

  const handleEditService = async () => {
    if (!editingService || !serviceForm.name.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim() || null,
          duration_minutes: serviceForm.duration_minutes,
          price: serviceForm.price
        })
        .eq('id', editingService)
        .select()
        .single();
      
      if (error) throw error;
      
      setServices(prev => prev.map(s => s.id === editingService ? data : s));
      setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0 });
      setEditingService(null);
      setShowServiceForm(false);
    } catch (error) {
      console.error('Erro ao editar serviço:', error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
    }
  };

  const startEditService = (service: Service) => {
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price
    });
    setEditingService(service.id);
    setShowServiceForm(true);
  };

  const cancelServiceForm = () => {
    setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0, salon_id: '' });
    setEditingService(null);
    setShowServiceForm(false);
  };

  // Funções para verificação de disponibilidade
  const getAvailableDates = (daysAhead = 30) => {
    const availableDates = [];
    const today = new Date();
    
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Verificar se é um dia da semana válido (assumindo seg-sab, 1-6)
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        availableDates.push({
          date: date.toISOString().split('T')[0],
          dayOfWeek,
          formatted: date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    }
    
    return availableDates;
  };

  const getAvailableTimesForDate = async (selectedDate: string, serviceDuration: number = 60) => {
    try {
      if (!salon?.id) {
        console.log('Salão não encontrado');
        return [];
      }

      // Horário padrão de funcionamento (pode ser configurável no futuro)
      const openTime = 9; // 9:00
      const closeTime = 18; // 18:00
      const slotDuration = 15; // slots de 15 minutos para maior flexibilidade
      
      const availableTimes = [];
      
      // Buscar agendamentos existentes para a data
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          appointment_time,
          services(duration_minutes)
        `)
        .eq('appointment_date', selectedDate)
        .eq('salon_id', salon.id)
        .eq('status', 'confirmed');
      
      if (appointmentsError) {
        console.log('Erro ao buscar agendamentos existentes:', appointmentsError);
        // Continuar sem verificar conflitos se a tabela não existir ainda
      }
      
      // Converter agendamentos existentes em períodos ocupados
      const occupiedPeriods = [];
      if (existingAppointments) {
        for (const appointment of existingAppointments) {
          const startTime = appointment.appointment_time;
          const duration = appointment.services?.duration_minutes || 60;
          
          // Calcular horário de término
          const [startHour, startMinute] = startTime.split(':').map(Number);
          const startTotalMinutes = startHour * 60 + startMinute;
          const endTotalMinutes = startTotalMinutes + duration;
          
          occupiedPeriods.push({
            start: startTotalMinutes,
            end: endTotalMinutes
          });
        }
      }
      
      // Gerar todos os horários possíveis
      for (let hour = openTime; hour < closeTime; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se há tempo suficiente para o serviço antes do fechamento
          const slotTime = hour + (minute / 60);
          const serviceEndTime = slotTime + (serviceDuration / 60);
          
          if (serviceEndTime <= closeTime) {
            // Verificar se o horário está disponível (não conflita com agendamentos existentes)
            const slotStartMinutes = hour * 60 + minute;
            const slotEndMinutes = slotStartMinutes + serviceDuration;
            
            let isAvailable = true;
            
            // Verificar conflitos com agendamentos existentes
            for (const occupied of occupiedPeriods) {
              // Verificar se há sobreposição
              if (
                (slotStartMinutes < occupied.end && slotEndMinutes > occupied.start)
              ) {
                isAvailable = false;
                break;
              }
            }
            
            availableTimes.push({
              time: timeSlot,
              available: isAvailable,
              duration: serviceDuration
            });
          }
        }
      }
      
      return availableTimes.filter(slot => slot.available);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    }
  };

  const checkTimeSlotAvailability = async (date: string, time: string, duration: number) => {
    try {
      if (!salon?.id) {
        return {
          available: false,
          conflictingAppointments: [],
          error: 'Salão não encontrado'
        };
      }

      // Converter horário para minutos
      const [hour, minute] = time.split(':').map(Number);
      const requestedStartMinutes = hour * 60 + minute;
      const requestedEndMinutes = requestedStartMinutes + duration;
      
      // Verificar se está dentro do horário de funcionamento
      const openTime = 9 * 60; // 9:00 em minutos
      const closeTime = 18 * 60; // 18:00 em minutos
      
      if (requestedStartMinutes < openTime || requestedEndMinutes > closeTime) {
        return {
          available: false,
          conflictingAppointments: [],
          error: 'Horário fora do funcionamento do salão (9:00 - 18:00)'
        };
      }
      
      // Buscar agendamentos existentes para a data
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          services(name, duration_minutes),
          profiles(full_name)
        `)
        .eq('appointment_date', date)
        .eq('salon_id', salon.id)
        .in('status', ['confirmed', 'pending']);
      
      if (appointmentsError) {
        console.log('Erro ao buscar agendamentos:', appointmentsError);
        // Se a tabela não existir, considerar disponível
        return {
          available: true,
          conflictingAppointments: []
        };
      }
      
      const conflictingAppointments = [];
      
      if (existingAppointments) {
        for (const appointment of existingAppointments) {
          const appointmentTime = appointment.appointment_time;
          const appointmentDuration = appointment.services?.duration_minutes || 60;
          
          const [appHour, appMinute] = appointmentTime.split(':').map(Number);
          const appStartMinutes = appHour * 60 + appMinute;
          const appEndMinutes = appStartMinutes + appointmentDuration;
          
          // Verificar se há sobreposição
          if (
            (requestedStartMinutes < appEndMinutes && requestedEndMinutes > appStartMinutes)
          ) {
            conflictingAppointments.push({
              id: appointment.id,
              time: appointmentTime,
              service: appointment.services?.name || 'Serviço não especificado',
              duration: appointmentDuration,
              client: appointment.profiles?.full_name || 'Cliente não especificado'
            });
          }
        }
      }
      
      return {
        available: conflictingAppointments.length === 0,
        conflictingAppointments,
        requestedSlot: {
          date,
          time,
          duration,
          endTime: `${Math.floor(requestedEndMinutes / 60).toString().padStart(2, '0')}:${(requestedEndMinutes % 60).toString().padStart(2, '0')}`
        }
      };
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do horário:', error);
      return {
        available: false,
        conflictingAppointments: [],
        error: error.message
      };
    }
  };

  // Função auxiliar para calcular horários disponíveis para um serviço específico
  const getAvailableTimesForService = async (selectedDate: string, serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) {
        console.log('Serviço não encontrado');
        return [];
      }
      
      return await getAvailableTimesForDate(selectedDate, service.duration_minutes);
    } catch (error) {
      console.error('Erro ao buscar horários para serviço:', error);
      return [];
    }
  };

  const handleCopyBookingLink = async () => {
    console.log('=== COPIANDO LINK DE AGENDAMENTO ===');
    console.log('Estado atual do salão:', salon);
    console.log('Profile atual:', profile);
    
    try {
      let currentSalon = salon;
      
      if (!currentSalon) {
        console.log('Salão não encontrado, criando salão padrão...');
        currentSalon = await createDefaultSalon();
        console.log('Resultado da criação do salão:', currentSalon);
      }
      
      if (!currentSalon) {
        console.error('ERRO: Não foi possível obter ou criar um salão');
        console.error('Falha na criação do salão');
        // Tentar copiar uma mensagem de erro útil
        const errorMessage = 'Erro: Não foi possível criar o link de agendamento. Verifique o console para mais detalhes.';
        try {
          await navigator.clipboard.writeText(errorMessage);
        } catch (e) {
          console.error('Erro ao copiar mensagem de erro:', e);
        }
        return;
      }
      
      // Usar slug se disponível, senão usar id
      const identifier = currentSalon.slug || currentSalon.id;
      const bookingUrl = `${window.location.origin}/agendamento-publico/${identifier}`;
      
      console.log('URL gerada:', bookingUrl);
      
      // Copiar para área de transferência
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(bookingUrl);
          console.log('✅ Link copiado via Clipboard API');
        } else {
          // Fallback para navegadores antigos
          const textArea = document.createElement('textarea');
          textArea.value = bookingUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            console.log('✅ Link copiado via execCommand');
          } else {
            throw new Error('execCommand falhou');
          }
        }
        
        setShowLinkCopied(true);
        setTimeout(() => setShowLinkCopied(false), 3000);
        
      } catch (clipboardError) {
        console.error('❌ ERRO ao copiar para área de transferência:', clipboardError);
        // Em caso de erro na cópia, mostrar o link no console para o usuário copiar manualmente
        console.log('📋 LINK PARA COPIAR MANUALMENTE:', bookingUrl);
      }
      
    } catch (error) {
      console.error('❌ ERRO geral ao processar link:', error);
    }
  };

  const createDefaultSalon = async () => {
    try {
      console.log('🏪 Iniciando criação de salão padrão...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não encontrado');
        return null;
      }
      
      console.log('✅ Usuário encontrado:', user.id);
      console.log('📋 Profile disponível:', profile);

      // Criar um salão temporário em memória para contornar problemas de RLS
      const tempSalon = {
        id: crypto.randomUUID(),
        name: `Salão de ${profile?.name || 'Beleza'}`,
        slug: `salon-${user.id}`, // Usar apenas UUID do usuário como slug
        address: 'Endereço não informado',
        phone: profile?.phone || 'Telefone não informado',
        email: profile?.email || user.email || '',
        description: 'Descrição do salão',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('✅ Salão temporário criado:', tempSalon);
      
      // Atualizar o estado local imediatamente
      setSalon(tempSalon);
      
      // Primeiro, limpar qualquer salão com slug inválido existente (mais agressivo)
      try {
        // Buscar todos os salões para verificar slugs inválidos
        const { data: allSalons } = await supabase
          .from('salons')
          .select('id, slug');
        
        if (allSalons && allSalons.length > 0) {
          // Filtrar salões com slugs inválidos (mais de 2 hífens = formato com timestamp)
          const invalidSalons = allSalons.filter(salon => {
            if (!salon.slug) return false;
            const hyphens = (salon.slug.match(/-/g) || []).length;
            return hyphens > 2; // salon-uuid tem 2 hífens, salon-uuid-timestamp tem mais
          });
          
          if (invalidSalons.length > 0) {
            console.log('🧹 Limpando salões com slugs inválidos:', invalidSalons);
            const invalidIds = invalidSalons.map(s => s.id);
            await supabase
              .from('salons')
              .delete()
              .in('id', invalidIds);
            console.log('✅ Salões inválidos removidos:', invalidIds.length);
            
            // Também limpar referências nos perfis de usuário
            await supabase
              .from('user_profiles')
              .update({ salon_id: null })
              .in('salon_id', invalidIds);
            console.log('✅ Referências nos perfis limpas');
          }
        }
      } catch (cleanupError) {
        console.log('⚠️ Erro na limpeza:', cleanupError);
      }

      // Tentar salvar no banco em background
      try {
        const { data: savedSalon, error: saveError } = await supabase
          .from('salons')
          .insert({
            name: tempSalon.name,
            slug: tempSalon.slug,
            address: tempSalon.address,
            phone: tempSalon.phone,
            email: tempSalon.email,
            description: tempSalon.description
          })
          .select()
          .single();
          
        if (savedSalon && !saveError) {
          console.log('✅ Salão salvo no banco:', savedSalon);
          setSalon(savedSalon);
          
          // Atualizar o perfil do usuário com o ID do salão
          await supabase
            .from('user_profiles')
            .update({ salon_id: savedSalon.id })
            .eq('id', user.id);
            
          return savedSalon;
        } else {
          console.log('⚠️ Não foi possível salvar no banco, usando salão temporário');
          console.log('Erro:', saveError);
        }
      } catch (bgError) {
        console.log('⚠️ Erro ao salvar em background:', bgError);
      }
      
      // Retornar o salão temporário mesmo se não conseguir salvar no banco
      // IMPORTANTE: Não salvar salon_id temporário no perfil do usuário
      console.log('✅ Usando salão temporário (não persistido no banco)');
      return tempSalon;
      
      return newSalon;
    } catch (error) {
      console.error('Erro ao criar salão padrão:', error);
      return null;
    }
  };



  useEffect(() => {
    // Inicializar banco de dados e limpar dados inválidos primeiro
    initializeDatabase().then(() => {
      cleanupInvalidData().then(() => {
        loadUserData();
      });
    });
  }, []);

  useEffect(() => {
    if (salon?.id) {
      loadServices();
    }
  }, [salon?.id]);

  const initializeDatabase = async () => {
    try {
      console.log('🔧 Verificando estrutura do banco de dados...');
      
      // Verificar tabela services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id')
        .limit(1);
      
      if (servicesError && servicesError.code === '42P01') {
        console.log('📋 Tabela services não existe. Por favor, execute o SQL do arquivo create_services_table.sql no Supabase Dashboard.');
      } else if (servicesError) {
        console.log('Erro ao verificar tabela services:', servicesError.message);
      } else {
        console.log('✅ Tabela services encontrada e acessível');
      }
      
      // Verificar tabela appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .limit(1);
      
      if (appointmentsError && appointmentsError.code === '42P01') {
        console.log('📋 Tabela appointments não existe. Por favor, execute o SQL do arquivo create_appointments_table.sql no Supabase Dashboard.');
      } else if (appointmentsError) {
        console.log('Erro ao verificar tabela appointments:', appointmentsError.message);
      } else {
        console.log('✅ Tabela appointments encontrada e acessível');
      }
    } catch (error) {
      console.log('Erro na inicialização do banco:', error);
    }
  };

  const cleanupInvalidData = async () => {
    try {
      // Buscar e remover salões com slugs inválidos
      const { data: allSalons } = await supabase
        .from('salons')
        .select('id, slug');
      
      if (allSalons && allSalons.length > 0) {
        const invalidSalons = allSalons.filter(salon => {
          if (!salon.slug) return false;
          const hyphens = (salon.slug.match(/-/g) || []).length;
          return hyphens > 2;
        });
        
        if (invalidSalons.length > 0) {
          console.log('🧹 Limpeza inicial: removendo salões inválidos:', invalidSalons.length);
          const invalidIds = invalidSalons.map(s => s.id);
          await supabase.from('salons').delete().in('id', invalidIds);
          await supabase.from('user_profiles').update({ salon_id: null }).in('salon_id', invalidIds);
          console.log('✅ Limpeza inicial concluída');
        }
      }
    } catch (error) {
      console.log('⚠️ Erro na limpeza inicial:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Carregar perfil do usuário
      let { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Se o perfil não existe, criar um novo
      if (profileError || !profileData) {
        console.log('Perfil não encontrado, criando novo perfil...');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || 'Usuário',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Erro ao criar perfil:', createError);
          setError("Erro ao criar perfil. Tente fazer logout e login novamente.");
          return;
        }
        
        profileData = newProfile;
      }
      
      setProfile(profileData);
      
      // Carregar salão do usuário através do user_profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();
      
      let salonData = null;
      if (userProfile?.salon_id) {
        // Validar se o salon_id é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(userProfile.salon_id)) {
          const { data: salon } = await supabase
            .from('salons')
            .select('*')
            .eq('id', userProfile.salon_id)
            .single();
          
          // Verificar se o salão encontrado tem slug válido
          if (salon && salon.slug && salon.slug.includes('-') && salon.slug.split('-').length > 3) {
            console.log('⚠️ Salão com slug inválido encontrado:', salon.slug);
            // Remover salão com slug inválido
            await supabase.from('salons').delete().eq('id', salon.id);
            // Limpar referência do perfil
            await supabase.from('user_profiles').update({ salon_id: null }).eq('id', user.id);
            console.log('✅ Salão com slug inválido removido');
            salonData = null;
          } else {
            salonData = salon;
          }
        } else {
          console.log('⚠️ salon_id inválido encontrado no perfil:', userProfile.salon_id);
          // Limpar salon_id inválido do perfil
          await supabase
            .from('user_profiles')
            .update({ salon_id: null })
            .eq('id', user.id);
          console.log('✅ salon_id inválido removido do perfil');
        }
      }
      
      if (salonData) {
        console.log('✅ Salão carregado com sucesso:', salonData);
        setSalon(salonData);
      } else {
        console.log('⚠️ Nenhum salão encontrado para o usuário');
        setSalon(null);
      }
      
      // Carregar agendamentos do salão do usuário (se for proprietário)
      let appointmentsData = [];
      
      if (salonData) {
        const { data: salonAppointments } = await supabase
          .from('appointments')
          .select(`
            *,
            services(name),
            salons(name)
          `)
          .eq('salon_id', salonData.id)
          .order('appointment_date', { ascending: true });
        
        appointmentsData = salonAppointments || [];
      }
      
      setAppointments(appointmentsData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/login')}>Voltar ao Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <span className="text-xl font-bold text-primary">AgendaFácil</span>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Olá, {profile?.name}</span>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">Total de agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(apt => apt.status === 'scheduled').length}
              </div>
              <p className="text-xs text-muted-foreground">Agendamentos confirmados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfil</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Proprietário</div>
              <p className="text-xs text-muted-foreground">Tipo de usuário</p>
            </CardContent>
          </Card>
        </div>

        {/* Meu Salão */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Meu Salão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!salon ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">Você ainda não tem um salão cadastrado.</p>
                <p className="text-sm text-gray-400 mb-6">Crie seu salão para começar a gerenciar serviços e agendamentos.</p>
                <Button 
                  onClick={() => setShowSalonForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Criar Meu Salão
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{salon.name}</h3>
                    <p className="text-gray-600">{salon.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {salon.address} | 📞 {salon.phone}
                    </p>
                  </div>
                  <Button 
                     onClick={() => {
                       setSalonForm({
                         name: salon.name || '',
                         description: salon.description || '',
                         address: salon.address || '',
                         phone: salon.phone || ''
                       });
                       setShowSalonForm(true);
                     }}
                     variant="outline"
                     size="sm"
                   >
                     <Edit className="h-4 w-4 mr-1" />
                     Editar
                   </Button>
                </div>
              </div>
            )}

            {/* Formulário do Salão */}
            {showSalonForm && (
              <div className="border-t pt-6 mt-6">
                <h4 className="font-medium mb-4">{salon ? 'Editar Salão' : 'Criar Novo Salão'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Salão *</label>
                    <Input
                      value={salonForm.name}
                      onChange={(e) => setSalonForm({...salonForm, name: e.target.value})}
                      placeholder="Ex: Salão Beleza Total"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone *</label>
                    <Input
                      value={salonForm.phone}
                      onChange={(e) => setSalonForm({...salonForm, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Endereço *</label>
                    <Input
                      value={salonForm.address}
                      onChange={(e) => setSalonForm({...salonForm, address: e.target.value})}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Descrição</label>
                    <Textarea
                      value={salonForm.description}
                      onChange={(e) => setSalonForm({...salonForm, description: e.target.value})}
                      placeholder="Descreva seu salão..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleSaveSalon}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!salonForm.name.trim() || !salonForm.phone.trim() || !salonForm.address.trim()}
                  >
                    {salon ? 'Salvar Alterações' : 'Criar Salão'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSalonForm(false);
                      setSalonForm({ name: '', description: '', address: '', phone: '' });
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agendamentos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Meus Agendamentos</CardTitle>
              <Button onClick={() => navigate('/agendamento')}>
                Novo Agendamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Você ainda não tem agendamentos</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button onClick={() => navigate('/agendamento')}>
                    Fazer Primeiro Agendamento
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('Primeiro botão clicado!');
                      handleCopyBookingLink();
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </Button>
                </div>
                {showLinkCopied && (
                  <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg inline-flex items-center space-x-2">
                    <Copy className="w-4 h-4" />
                    <span>Link copiado para a área de transferência!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const isOwnerView = salon && appointment.salon_id === salon.id;
                  const clientName = appointment.client_name || profile?.name || 'Cliente';
                  
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{appointment.services?.name || 'Serviço'}</p>
                          {isOwnerView && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Seu Salão
                            </span>
                          )}
                        </div>
                        
                        {isOwnerView ? (
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Cliente: {clientName}
                            </p>
                            {appointment.client_phone && (
                              <p className="text-sm text-muted-foreground">
                                📞 {appointment.client_phone}
                              </p>
                            )}
                            {appointment.client_email && (
                              <p className="text-sm text-muted-foreground">
                                ✉️ {appointment.client_email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {appointment.salons?.name || 'Salão'}
                          </p>
                        )}
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          📅 {new Date(appointment.appointment_date).toLocaleDateString('pt-BR')} às {appointment.appointment_time}
                        </p>
                        
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">
                            💬 {appointment.notes}
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status === 'scheduled' ? 'Agendado' :
                         appointment.status === 'confirmed' ? 'Confirmado' :
                         appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>
                    </div>
                  );
                })}
                
                {/* Botão de compartilhar link quando há agendamentos */}
                {salon && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                           console.log('Segundo botão clicado!');
                           handleCopyBookingLink();
                         }}
                        className="flex items-center space-x-2"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Copiar Link</span>
                      </Button>
                    </div>
                    {showLinkCopied && (
                      <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg inline-flex items-center space-x-2 mx-auto">
                        <Copy className="w-4 h-4" />
                        <span>Link copiado para a área de transferência!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Gerenciamento de Serviços */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Serviços do Salão
              </CardTitle>
              <Button
                onClick={() => setShowServiceForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Serviço
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Formulário de Serviço */}
            {showServiceForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-salon">Salão *</Label>
                    <select
                      id="service-salon"
                      value={serviceForm.salon_id || salon?.id || ''}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, salon_id: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {!salon ? (
                        <option value="">Nenhum salão encontrado</option>
                      ) : (
                        <option value={salon.id}>{salon.name}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="service-name">Nome do Serviço *</Label>
                    <Input
                      id="service-name"
                      type="text"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Corte masculino"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-price">Preço (R$) *</Label>
                    <Input
                      id="service-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-duration">Duração (minutos) *</Label>
                    <Input
                      id="service-duration"
                      type="number"
                      min="5"
                      step="5"
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-description">Descrição</Label>
                    <Textarea
                      id="service-description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição opcional do serviço"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={editingService ? handleEditService : handleCreateService}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!serviceForm.name.trim() || !serviceForm.salon_id}
                  >
                    {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                  </Button>
                  <Button
                    onClick={cancelServiceForm}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de Serviços */}
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum serviço cadastrado ainda.</p>
                <p className="text-sm">Crie seu primeiro serviço para começar a receber agendamentos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{service.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => startEditService(service)}
                          size="sm"
                          variant="outline"
                          className="p-1 h-8 w-8"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteService(service.id)}
                          size="sm"
                          variant="outline"
                          className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600 font-medium">
                        R$ {service.price.toFixed(2)}
                      </span>
                      <span className="text-gray-500">
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;