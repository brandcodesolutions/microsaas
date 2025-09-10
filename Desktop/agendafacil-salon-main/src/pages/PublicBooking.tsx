import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  Instagram, 
  MessageCircle, 
  Star, 
  Camera, 
  Globe,
  Facebook,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Salon {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  cover_image_url?: string;
  opening_time?: string;
  closing_time?: string;
  instagram?: string;
  whatsapp?: string;
  specialization?: string;
  monday_hours?: string;
  tuesday_hours?: string;
  wednesday_hours?: string;
  thursday_hours?: string;
  friday_hours?: string;
  saturday_hours?: string;
  sunday_hours?: string;
  facebook?: string;
  website?: string;
  gallery?: string[];
  rating?: number;
  total_reviews?: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
}

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
  service_name?: string;
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
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('por');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [occupiedTimeSlots, setOccupiedTimeSlots] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('booking');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: ""
  });

  const photos: string[] = salon?.gallery || [];
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const getAvailableTimesForService = async (date: string, serviceId: string) => {
    if (!salon?.id) return [];
    
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return [];

      const serviceDuration = service.duration_minutes;
      let salonIdForQuery = salon.id;
      
      if (!isValidUUID(salon.id)) {
        salonIdForQuery = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';
      }

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('salon_id', salonIdForQuery)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
      }

      const availableTimes: string[] = [];
      let interval = 30;
      
      if (serviceDuration % 30 === 0) {
        interval = 30;
      } else if (serviceDuration % 15 === 0) {
        interval = 15;
      }

      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotStart = new Date(`2000-01-01T${timeString}:00`);
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

          let hasConflict = false;

          for (const appointment of appointments || []) {
            const appointmentStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
            const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);

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

  const getOccupiedTimesForDate = async (date: string) => {
    if (!salon?.id) return [];
    
    let salonIdForQuery = salon.id;
    if (!isValidUUID(salon.id)) {
      salonIdForQuery = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';
    }

    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('salon_id', salonIdForQuery)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        console.error('Erro ao buscar horários ocupados:', error);
        return [];
      }

      return appointments || [];
    } catch (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      return [];
    }
  };

  const getAllPossibleTimes = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return [];

    const serviceDuration = service.duration_minutes;
    let interval = 30;
    
    if (serviceDuration % 30 === 0) {
      interval = 30;
    } else if (serviceDuration % 15 === 0) {
      interval = 15;
    }

    const times = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotStart = new Date(`2000-01-01T${timeString}:00`);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
        
        if (slotEnd.getHours() <= 18) {
          times.push(timeString);
        }
      }
    }
    return times;
  };

  const isTimeOccupied = (time: string) => {
    return occupiedTimeSlots.some(appointment => {
      const appointmentStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);
      const slotTime = new Date(`2000-01-01T${time}:00`);
      
      return slotTime >= appointmentStart && slotTime < appointmentEnd;
    });
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }
  };

  const formatRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  useEffect(() => {
    if (salonId) {
      loadSalonData();
      fetchReviews();
    }
  }, [salonId]);

  useEffect(() => {
    if (bookingData.appointmentDate && bookingData.serviceId) {
      loadAvailableTimeSlots();
    } else {
      setAvailableTimeSlots([]);
    }
  }, [bookingData.appointmentDate, bookingData.serviceId]);

  const loadAvailableTimeSlots = async () => {
    if (!bookingData.appointmentDate || !bookingData.serviceId) {
      return;
    }

    try {
      const [times, occupied] = await Promise.all([
        getAvailableTimesForService(bookingData.appointmentDate, bookingData.serviceId),
        getOccupiedTimesForDate(bookingData.appointmentDate)
      ]);
      
      setAvailableTimeSlots(times);
      setOccupiedTimeSlots(occupied);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setAvailableTimeSlots([]);
    }
  };

  const loadSalonData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const slugRegex = /^[a-z0-9-]+$/;
      
      if (!salonId || (!uuidRegex.test(salonId) && !slugRegex.test(salonId))) {
        setError('ID do salão inválido.');
        return;
      }

      let salonQuery = supabase.from('salons').select('*');
      
      if (uuidRegex.test(salonId)) {
        salonQuery = salonQuery.eq('id', salonId);
      } else {
        salonQuery = salonQuery.eq('slug', salonId);
      }

      const { data: salonData, error: salonError } = await salonQuery.single();

      if (salonError) {
        console.log('Erro ao buscar salão, usando dados de teste:', salonError);
        const testSalon = {
          id: '32b4dcc5-05b0-4116-9a5b-27c5914d915f',
          name: 'Salão Exemplo',
          address: 'Rua das Flores, 123 - Centro',
          phone: '(11) 99999-9999',
          email: 'contato@salaoexemplo.com',
          description: 'Um salão moderno e acolhedor, especializado em cortes e tratamentos capilares.',
          cover_image_url: null,
          opening_time: '09:00',
          closing_time: '18:00',
          instagram: '@salaoexemplo',
          whatsapp: '5511999999999',
          specialization: 'Cortes e Tratamentos Capilares'
        };
        setSalon(testSalon);
        
        const testServices = [
          {
            id: 'service-1',
            name: 'Corte Feminino',
            price: 5000,
            duration_minutes: 60,
            description: 'Corte moderno e personalizado'
          },
          {
            id: 'service-2', 
            name: 'Corte Masculino',
            price: 3000,
            duration_minutes: 45,
            description: 'Corte clássico ou moderno'
          },
          {
            id: 'service-3',
            name: 'Escova',
            price: 4000,
            duration_minutes: 45,
            description: 'Escova modeladora'
          },
          {
            id: 'service-4',
            name: 'Coloração',
            price: 12000,
            duration_minutes: 120,
            description: 'Coloração completa'
          }
        ];
        setServices(testServices);
      } else {
        setSalon(salonData);
        
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', salonData.id);

        if (servicesError) {
          console.error('Erro ao buscar serviços:', servicesError);
        } else {
          const validServices = (servicesData || []).map(service => {
            return {
              ...service,
              price: typeof service.price === 'number' ? service.price : parseInt(service.price) || 0,
              duration_minutes: typeof service.duration_minutes === 'number' ? service.duration_minutes : parseInt(service.duration_minutes) || 60
            };
          });
          setServices(validServices);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do salão.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BookingData, value: string) => {
    try {
      setBookingData(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
    }
  };

  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const selectedService = services.find(s => s.id === bookingData.serviceId);
      if (!selectedService) {
        setError('Serviço não encontrado.');
        setSubmitting(false);
        return;
      }

      if (salon?.id) {
        let salonIdForQuery = salon.id;
        if (!isValidUUID(salon.id)) {
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

        if (existingAppointments && existingAppointments.length > 0) {
          const newAppointmentStart = new Date(`2000-01-01T${bookingData.appointmentTime}:00`);
          const newAppointmentEnd = new Date(newAppointmentStart.getTime() + selectedService.duration_minutes * 60000);

          for (const appointment of existingAppointments) {
            const existingStart = new Date(`2000-01-01T${appointment.appointment_time}:00`);
            const existingEnd = new Date(existingStart.getTime() + appointment.duration_minutes * 60000);

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
      }

      let salonIdForInsert = salon?.id;
      if (!salon?.id) {
        setError('Erro: Salão não encontrado.');
        setSubmitting(false);
        return;
      }
      
      if (!isValidUUID(salon.id)) {
        salonIdForInsert = '32b4dcc5-05b0-4116-9a5b-27c5914d915f';
      }

      let serviceIdForInsert = bookingData.serviceId;
      if (!isValidUUID(bookingData.serviceId)) {
        const serviceMapping: { [key: string]: string } = {
          'service-1': '550e8400-e29b-41d4-a716-446655440001',
          'service-2': '550e8400-e29b-41d4-a716-446655440002', 
          'service-3': '550e8400-e29b-41d4-a716-446655440003'
        };
        serviceIdForInsert = serviceMapping[bookingData.serviceId] || '550e8400-e29b-41d4-a716-446655440001';
      }

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          salon_id: salonIdForInsert,
          service_id: serviceIdForInsert,
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
        
      if (insertError) {
        console.error('Erro detalhado ao inserir agendamento:', insertError);
        setError(`Erro ao criar agendamento: ${insertError.message || 'Erro desconhecido'}`);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #8B5CF610, #8B5CF605)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#8B5CF6' }}></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #8B5CF610, #8B5CF605)' }}>
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 mb-6 text-sm sm:text-base">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const themeColor = '#8B5CF6';
  
  const translations = {
    por: {
      onlineBooking: 'Agendamento Online',
      services: 'Meus Serviços',
      chooseService: 'Escolha um serviço!',
      information: 'Informações',
      contacts: 'Contatos',
      phone: 'Telefone',
      specialization: 'Especialização',
      workingHours: 'Horários de Funcionamento',
      photos: 'Fotos',
      noPhotos: 'Nenhuma foto ainda',
      reviews: 'Avaliações',
      noReviews: 'Nenhuma avaliação ainda',
      writeReview: 'Escrever Avaliação',
      bookAppointment: 'Agendar Horário',
      fullName: 'Nome Completo',
      email: 'E-mail',
      service: 'Serviço',
      date: 'Data',
      time: 'Horário',
      notes: 'Observações',
      confirmBooking: 'Confirmar Agendamento',
      phoneNumber: 'Número de telefone',
      emailAddress: 'Endereço de e-mail'
    },
    eng: {
      onlineBooking: 'Online Booking',
      services: 'My Services',
      chooseService: 'Choose a service!',
      information: 'Information',
      contacts: 'Contacts',
      phone: 'Phone',
      specialization: 'Specialization',
      workingHours: 'Working Hours',
      photos: 'Photos',
      noPhotos: 'No Photos yet',
      reviews: 'Reviews',
      noReviews: 'No Reviews yet',
      writeReview: 'Write a Review',
      bookAppointment: 'Book Appointment',
      fullName: 'Full Name',
      email: 'Email',
      service: 'Service',
      date: 'Date',
      time: 'Time',
      notes: 'Notes',
      confirmBooking: 'Confirm Booking',
      phoneNumber: 'Phone number',
      emailAddress: 'Email address'
    }
  };

  const t = translations[selectedLanguage as keyof typeof translations] || translations.por;

  const weekDays = {
    por: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    eng: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };

  const days = weekDays[selectedLanguage as keyof typeof weekDays] || weekDays.por;
  
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const gradientBg = `linear-gradient(135deg, ${hexToRgba(themeColor, 0.1)}, ${hexToRgba(themeColor, 0.05)})`;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Agendamento Confirmado!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação por email.
            </p>
            <Button 
              onClick={() => setSuccess(false)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-3 text-lg"
            >
              Fazer Novo Agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com informações do salão */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-gradient-to-r from-pink-500 to-purple-600 relative overflow-hidden">
          {salon?.cover_image_url && (
            <img 
              src={salon.cover_image_url} 
              alt={salon.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLanguage('por')}
              className={`${selectedLanguage === 'por' ? 'bg-white text-gray-900' : 'bg-white/20 text-white border-white/30'} backdrop-blur-sm`}
            >
              🇧🇷 Por
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLanguage('eng')}
              className={`${selectedLanguage === 'eng' ? 'bg-white text-gray-900' : 'bg-white/20 text-white border-white/30'} backdrop-blur-sm`}
            >
              🇺🇸 Eng
            </Button>
          </div>
        </div>
        
        {/* Salon Info Card */}
        <div className="relative -mt-16 mx-4 md:mx-8">
          <Card className="shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{salon?.name}</h1>
                  <p className="text-gray-600 mb-3">{salon?.description || 'Barbearia profissional'}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {formatRating(salon?.rating || 4.8)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{salon?.rating || 4.8}</span>
                    <span className="text-sm text-gray-500">({salon?.total_reviews || 127} avaliações)</span>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{salon?.address}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{salon?.phone}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 mt-6">
        <div className="px-4 md:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="booking" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none py-4 px-2"
                style={{
                  borderBottomColor: activeTab === 'booking' ? themeColor : 'transparent',
                  color: activeTab === 'booking' ? themeColor : '#6B7280'
                }}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-medium">{t.bookAppointment}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none py-4 px-2"
                style={{
                  borderBottomColor: activeTab === 'services' ? themeColor : 'transparent',
                  color: activeTab === 'services' ? themeColor : '#6B7280'
                }}
              >
                <div className="flex flex-col items-center space-y-1">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-medium">{t.services}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="photos" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none py-4 px-2"
                style={{
                  borderBottomColor: activeTab === 'photos' ? themeColor : 'transparent',
                  color: activeTab === 'photos' ? themeColor : '#6B7280'
                }}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Camera className="w-5 h-5" />
                  <span className="text-xs font-medium">{t.photos}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none py-4 px-2"
                style={{
                  borderBottomColor: activeTab === 'reviews' ? themeColor : 'transparent',
                  color: activeTab === 'reviews' ? themeColor : '#6B7280'
                }}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Star className="w-5 h-5" />
                  <span className="text-xs font-medium">{t.reviews}</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <div className="px-4 md:px-8 py-6">
               <TabsContent value="booking" className="mt-0">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Booking Form */}
                   <Card className="shadow-lg">
                     <CardHeader>
                       <CardTitle className="text-xl font-bold text-gray-900">{t.bookAppointment}</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-6">
                       <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="clientName" className="text-sm font-medium text-gray-700">
                      {t.fullName}
                    </Label>
                    <Input
                      id="clientName"
                      type="text"
                      value={bookingData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      placeholder={t.fullName}
                      className="mt-1 h-11"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientPhone" className="text-sm font-medium text-gray-700">
                        {t.phone}
                      </Label>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={bookingData.clientPhone}
                        onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                        placeholder={t.phoneNumber}
                        className="mt-1 h-11"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="clientEmail" className="text-sm font-medium text-gray-700">
                        {t.email}
                      </Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={bookingData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        placeholder={t.emailAddress}
                        className="mt-1 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t.service}
                    </Label>
                    {!loading ? (
                      <div className="space-y-2">
                        {services && services.length > 0 ? (
                          <div className="grid gap-2">
                            {services.map((service) => (
                              <div
                                key={service.id}
                                onClick={() => handleInputChange('serviceId', service.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  bookingData.serviceId === service.id
                                    ? 'border-2'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={{
                                  borderColor: bookingData.serviceId === service.id ? themeColor : undefined,
                                  backgroundColor: bookingData.serviceId === service.id ? `${themeColor}10` : undefined
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                                    {service.description && (
                                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {service.duration_minutes} min
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-semibold" style={{ color: themeColor }}>
                                      R$ {(service.price / 100).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>{t.chooseService}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: themeColor }}></div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">
                        {t.date}
                      </Label>
                      <Input
                        id="appointmentDate"
                        type="date"
                        value={bookingData.appointmentDate}
                        onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                        min={getMinDate()}
                        className="mt-1 h-11"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {t.time}
                      </Label>
                      {!bookingData.serviceId ? (
                        <div className="text-sm text-gray-500 py-2">
                          Primeiro selecione um serviço
                        </div>
                      ) : !bookingData.appointmentDate ? (
                        <div className="text-sm text-gray-500 py-2">
                          Primeiro selecione uma data
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                          {getAllPossibleTimes(bookingData.serviceId).map((time) => {
                            const isAvailable = availableTimeSlots.includes(time);
                            const isSelected = bookingData.appointmentTime === time;
                            const isOccupied = isTimeOccupied(time);
                            
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => isAvailable ? handleInputChange('appointmentTime', time) : null}
                                disabled={!isAvailable}
                                className={`
                                  px-2 py-1 text-xs rounded border transition-all
                                  ${isSelected
                                    ? 'text-white border-2'
                                    : isAvailable
                                    ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                  }
                                `}
                                style={{
                                  backgroundColor: isSelected ? themeColor : isAvailable ? 'white' : '#f9f9f9',
                                  borderColor: isSelected ? themeColor : undefined
                                }}
                              >
                                {time}
                                {isSelected && (
                                  <span className="ml-1">✓</span>
                                )}
                                {!isSelected && !isAvailable && (
                                  <span className="ml-1 text-red-400">✗</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {availableTimeSlots.length === 0 && bookingData.appointmentDate && bookingData.serviceId && (
                        <div className="text-sm text-orange-600 mt-2">
                          Nenhum horário disponível para esta data. Tente outra data.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      {t.notes} (opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={bookingData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Alguma observação especial?"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!isFormValid() || submitting}
                    className="w-full h-12 font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    {submitting ? 'Agendando...' : t.confirmBooking}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Services List */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">{t.ourServices}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <p className="text-sm text-gray-500 mt-1">{service.duration} minutos</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">R$ {service.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-0">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">{t.ourServices}</CardTitle>
              <p className="text-gray-600">Conheça todos os nossos serviços e preços</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {services.map((service) => (
                  <div key={service.id} className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                        <p className="text-gray-600 mb-3">{service.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-2xl font-bold text-gray-900">R$ {service.price.toFixed(2)}</p>
                        <Button 
                          onClick={() => {
                            setBookingData({...bookingData, serviceId: service.id});
                            setActiveTab('booking');
                          }}
                          className="mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        >
                          Agendar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-0">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">{t.photos}</CardTitle>
              <p className="text-gray-600">Galeria de fotos do nosso estabelecimento</p>
            </CardHeader>
            <CardContent>
              {photos.length > 0 ? (
                <div>
                  {/* Main Image */}
                  <div className="relative mb-6">
                    <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                      <img 
                        src={photos[currentImageIndex]} 
                        alt={`Foto ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photos.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Grid */}
                  {photos.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex ? 'border-pink-500' : 'border-transparent'
                          }`}
                        >
                          <img 
                            src={photo} 
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma foto disponível</h3>
                  <p className="text-gray-600">As fotos do estabelecimento serão exibidas aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="information" className="mt-0">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Informações do Estabelecimento</CardTitle>
              <p className="text-gray-600">Conheça mais sobre nosso salão</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato</h3>
                  
                  {salon?.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Telefone</p>
                        <a href={`tel:${salon.phone}`} className="text-gray-600 hover:text-pink-600 transition-colors">
                          {salon.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {salon?.email && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">E-mail</p>
                        <a href={`mailto:${salon.email}`} className="text-gray-600 hover:text-pink-600 transition-colors">
                          {salon.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {salon?.address && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Endereço</p>
                        <p className="text-gray-600">{salon.address}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Working Hours */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário de Funcionamento</h3>
                  
                  {salon?.opening_time && salon?.closing_time && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Horários</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Segunda - Sexta</span>
                          <span className="font-medium text-gray-900">{salon.opening_time} - {salon.closing_time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Sábado</span>
                          <span className="font-medium text-gray-900">{salon.opening_time} - {salon.closing_time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Domingo</span>
                          <span className="font-medium text-red-600">Fechado</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* About Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sobre Nós</h3>
                <p className="text-gray-600 leading-relaxed">
                  {salon?.description || "Bem-vindos ao nosso salão! Oferecemos serviços de alta qualidade com profissionais experientes e dedicados ao seu bem-estar e beleza. Nossa missão é proporcionar uma experiência única e relaxante, sempre com os melhores produtos e técnicas do mercado."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-0">
          <div className="space-y-6">
            {/* Reviews Summary */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Avaliações</h2>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center">
                        {formatRating(salon?.rating || 4.8)}
                      </div>
                      <span className="text-xl font-bold text-gray-900">{salon?.rating || 4.8}</span>
                      <span className="text-gray-600">({salon?.total_reviews || 127} avaliações)</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    Avaliar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{review.client_name}</span>
                              <Badge variant="secondary" className="text-xs">{review.service_name}</Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {formatRating(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação ainda</h3>
                    <p className="text-gray-600">Seja o primeiro a avaliar este estabelecimento!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Form */}
            {showReviewForm && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Deixe sua avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nome</Label>
                    <Input placeholder="Seu nome" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Avaliação</Label>
                    <div className="flex space-x-1 mt-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button key={rating} className="p-1">
                          <Star className="w-6 h-6 text-gray-300 hover:text-yellow-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Comentário</Label>
                    <Textarea 
                      placeholder="Conte sobre sua experiência..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      Enviar Avaliação
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}