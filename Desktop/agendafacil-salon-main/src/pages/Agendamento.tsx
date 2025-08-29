import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Clock, User, Phone, Mail, Scissors, MapPin } from 'lucide-react';
import { apiService, type Salon } from '@/services/api';

const Agendamento = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const [salonInfo, setSalonInfo] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    email: "",
    service: "",
    professional: "",
    date: "",
    time: "",
    observations: ""
  });

  const [services, setServices] = useState([
    { name: "Corte Feminino", duration: "60 min", price: "R$ 50,00" },
    { name: "Corte Masculino", duration: "30 min", price: "R$ 25,00" },
    { name: "Escova", duration: "45 min", price: "R$ 35,00" },
    { name: "Manicure", duration: "60 min", price: "R$ 30,00" },
    { name: "Pedicure", duration: "60 min", price: "R$ 35,00" },
    { name: "Coloração", duration: "120 min", price: "R$ 80,00" }
  ]);

  const [professionals, setProfessionals] = useState([
    "Ana Silva - Cabelereiro",
    "Carlos Santos - Barbeiro", 
    "Lucia Costa - Manicure",
    "Pedro Oliveira - Cabelereiro"
  ]);

  // Carregar informações do salão e dados do localStorage
  useEffect(() => {
    const loadSalonInfo = async () => {
      if (!salonId) {
        setLoading(false);
        return;
      }

      try {
        const salon = await apiService.getSalon(salonId);
        setSalonInfo(salon);
      } catch (error) {
        console.error('Erro ao carregar informações do salão:', error);
        toast.error('Erro ao carregar informações do salão');
      } finally {
        setLoading(false);
      }
    };

    loadSalonInfo();

    if (salonId) {
      const savedServices = localStorage.getItem(`services_${salonId}`);
      const savedProfessionals = localStorage.getItem(`professionals_${salonId}`);
      
      if (savedServices) {
        const parsedServices = JSON.parse(savedServices);
        if (parsedServices.length > 0) {
          setServices(parsedServices);
        }
      }
      
      if (savedProfessionals) {
        const parsedProfessionals = JSON.parse(savedProfessionals);
        if (parsedProfessionals.length > 0) {
          setProfessionals(parsedProfessionals.map(p => `${p.name} - ${p.specialty}`));
        }
      }
    }
  }, [salonId]);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salonId) {
      toast({
        title: "Erro",
        description: "ID do salão não encontrado",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await apiService.createAppointment(salonId, {
        clientName: formData.clientName,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        professional: formData.professional,
        date: formData.date,
        time: formData.time,
        observations: formData.observations
      });
      
      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi enviado com sucesso. Entraremos em contato para confirmação."
      });
      
      // Reset form
      setFormData({
        clientName: "",
        phone: "",
        email: "",
        service: "",
        professional: "",
        date: "",
        time: "",
         observations: ""
      });
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar seu agendamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-primary">Salão Beleza Total</h1>
            </div>
            <p className="text-muted-foreground">Agende seu horário online</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Salon Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Informações do Salão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                  <p className="font-medium">Rua das Flores, 123 - Centro</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                  <p className="font-medium">(11) 3333-4444</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p className="font-medium">contato@belezatotal.com</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horário de Funcionamento</p>
                  <p className="font-medium">Segunda a Sábado: 9h às 18h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nossos Serviços</CardTitle>
              <CardDescription>Conheça nossos serviços e preços</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.duration}</p>
                    <p className="text-lg font-bold text-primary">{service.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Horário
              </CardTitle>
              <CardDescription>Preencha os dados abaixo para agendar seu horário</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nome Completo *</Label>
                    <Input
                      id="clientName"
                      placeholder="Seu nome completo"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                {/* Service Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service">Serviço *</Label>
                    <select
                      id="service"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
                      required
                    >
                      <option value="">Selecione um serviço</option>
                      {services.map((service, index) => (
                        <option key={index} value={service.name}>
                          {service.name} - {service.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="professional">Profissional (Opcional)</Label>
                    <select
                      id="professional"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={formData.professional}
                      onChange={(e) => setFormData({...formData, professional: e.target.value})}
                    >
                      <option value="">Sem preferência</option>
                      {professionals.map((prof, index) => (
                        <option key={index} value={prof}>{prof}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Horário *</Label>
                    <select
                      id="time"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    >
                      <option value="">Selecione um horário</option>
                      {timeSlots.map((time, index) => (
                        <option key={index} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Alguma observação especial?"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Agendamento;