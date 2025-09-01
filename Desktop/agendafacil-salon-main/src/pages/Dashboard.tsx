import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, BarChart3, Settings, Share2, Bell, Plus, Edit, Trash2, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabaseApi, type Appointment, type User } from "@/services/supabase-api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [salonInfo, setSalonInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [newService, setNewService] = useState({ name: "", duration: "", price: "" });
  const [newProfessional, setNewProfessional] = useState({ name: "", specialty: "", phone: "" });
  const [salonSettings, setSalonSettings] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    workingHours: ""
  });

  const handleLogout = async () => {
    await supabaseApi.auth.signOut();
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    toast({
      title: "Logout realizado com sucesso!",
      description: "Você foi desconectado do sistema."
    });
    navigate('/login', { replace: true });
  };



  // Carregar dados do salão específico
  useEffect(() => {
    if (salonId) {
      // Carregar configurações do salão
      const salonData = JSON.parse(localStorage.getItem(`salon_${salonId}`) || '{}');
      if (salonData.name) {
        setSalonSettings(salonData);
      } else {
        // Dados padrão se não existir
        const defaultSettings = {
          name: `Salão ${salonId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          address: "Endereço não informado",
          phone: "Telefone não informado",
          email: "Email não informado",
          workingHours: "Segunda a Sábado: 9h às 18h"
        };
        setSalonSettings(defaultSettings);
        localStorage.setItem(`salon_${salonId}`, JSON.stringify(defaultSettings));
      }

      // Carregar serviços do salão
      const servicesData = JSON.parse(localStorage.getItem(`services_${salonId}`) || '[]');
      if (servicesData.length === 0) {
        const defaultServices = [
          { id: 1, name: "Corte Feminino", duration: 60, price: 50 },
          { id: 2, name: "Corte Masculino", duration: 30, price: 30 },
          { id: 3, name: "Coloração", duration: 120, price: 80 },
        ];
        setServices(defaultServices);
        localStorage.setItem(`services_${salonId}`, JSON.stringify(defaultServices));
      } else {
        setServices(servicesData);
      }

      // Carregar profissionais do salão
      const professionalsData = JSON.parse(localStorage.getItem(`professionals_${salonId}`) || '[]');
      if (professionalsData.length === 0) {
        const defaultProfessionals = [
          { id: 1, name: "Maria Silva", specialty: "Cabeleireira", phone: "(11) 99999-9999" },
          { id: 2, name: "João Santos", specialty: "Barbeiro", phone: "(11) 88888-8888" },
        ];
        setProfessionals(defaultProfessionals);
        localStorage.setItem(`professionals_${salonId}`, JSON.stringify(defaultProfessionals));
      } else {
        setProfessionals(professionalsData);
      }
    }
  }, [salonId]);

  // Carregar dados usando o Supabase
  useEffect(() => {
    const carregarDados = async () => {
      // Verificar se há usuário autenticado
      const storedUserId = localStorage.getItem('userId');
      const storedUserEmail = localStorage.getItem('userEmail');
      
      if (!storedUserId || !storedUserEmail) {
        toast({
          title: "Erro de Autenticação",
          description: "Você precisa fazer login para acessar o dashboard",
          variant: "destructive"
        });
        navigate('/login');
        setLoading(false);
        return;
      }
      
      setUserId(storedUserId);
      
      try {
        // Carregar informações do usuário
        const userResponse = await supabaseApi.users.getProfile(storedUserId);
        if (userResponse.success) {
          setSalonInfo(userResponse.data);
        }
        
        // Carregar agendamentos do usuário
        const appointmentsResponse = await supabaseApi.appointments.getByUserId(storedUserId);
        if (appointmentsResponse.success) {
          setAgendamentos(appointmentsResponse.data);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do dashboard",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [toast, navigate]);

  const atualizarAgendamentos = () => {
    if (!salonId) return;
    const agendamentosSalvos = JSON.parse(localStorage.getItem(`agendamentos_${salonId}`) || '[]');
    setAgendamentos(agendamentosSalvos);
    toast({
      title: "Agendamentos atualizados",
      description: "Lista de agendamentos foi atualizada com sucesso."
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmado</Badge>;
      case "pendente":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendente</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header com Logout */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-primary">AgendaFácil</span>
              <p className="text-sm text-muted-foreground">Painel de Controle</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const salonLink = `${window.location.origin}/agendamento/salao-beleza-total`;
                navigator.clipboard.writeText(salonLink).then(() => {
                  toast({ 
                    title: "Link copiado!", 
                    description: "O link de agendamento foi copiado para a área de transferência." 
                  });
                }).catch(() => {
                  toast({ 
                    title: "Link de Agendamento", 
                    description: salonLink,
                    duration: 10000
                  });
                });
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar Link
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+20% em relação a ontem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68</div>
              <p className="text-xs text-muted-foreground">+12% em relação à semana passada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Ana, Carlos, Lucia, Pedro</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 8.450</div>
              <p className="text-xs text-muted-foreground">+15% em relação ao mês passado</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Agendamentos Recentes</CardTitle>
                      <CardDescription>Gerencie os agendamentos do seu salão</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={atualizarAgendamentos}>
                        Atualizar
                      </Button>
                      <Button>
                        <Bell className="w-4 h-4 mr-2" />
                        Notificar Clientes
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                  {agendamentos.length > 0 ? agendamentos.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold">{appointment.cliente}</h3>
                            <p className="text-sm text-muted-foreground">{appointment.telefone}</p>
                          </div>
                          <div>
                            <p className="font-medium">{appointment.servico}</p>
                            <p className="text-sm text-muted-foreground">com {appointment.profissional}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{appointment.data}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {appointment.horario}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(appointment.status)}
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Serviços Oferecidos</CardTitle>
                    <CardDescription>Configure os serviços do seu salão</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Formulário para adicionar serviço */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Adicionar Novo Serviço</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="serviceName">Nome do Serviço</Label>
                          <Input
                            id="serviceName"
                            placeholder="Ex: Corte Feminino"
                            value={newService.name}
                            onChange={(e) => setNewService({...newService, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="serviceDuration">Duração (min)</Label>
                          <Input
                            id="serviceDuration"
                            type="number"
                            placeholder="60"
                            value={newService.duration}
                            onChange={(e) => setNewService({...newService, duration: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="servicePrice">Preço (R$)</Label>
                          <Input
                            id="servicePrice"
                            type="number"
                            placeholder="50"
                            value={newService.price}
                            onChange={(e) => setNewService({...newService, price: e.target.value})}
                          />
                        </div>
                      </div>
                      <Button 
                        className="mt-4" 
                        onClick={() => {
                          if (newService.name && newService.duration && newService.price) {
                            const updatedServices = [...services, {
                              id: services.length + 1,
                              name: newService.name,
                              duration: parseInt(newService.duration),
                              price: parseFloat(newService.price)
                            }];
                            setServices(updatedServices);
                            localStorage.setItem(`services_${salonId}`, JSON.stringify(updatedServices));
                            setNewService({ name: "", duration: "", price: "" });
                            toast({ title: "Serviço adicionado com sucesso!" });
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Serviço
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Lista de serviços */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Serviços Cadastrados</h3>
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.duration} min • R$ {service.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const updatedServices = services.filter(s => s.id !== service.id);
                              setServices(updatedServices);
                              localStorage.setItem(`services_${salonId}`, JSON.stringify(updatedServices));
                              toast({ title: "Serviço removido com sucesso!" });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professionals">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Profissionais</CardTitle>
                    <CardDescription>Gerencie sua equipe</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Formulário para adicionar profissional */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Adicionar Novo Profissional</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="professionalName">Nome Completo</Label>
                          <Input
                            id="professionalName"
                            placeholder="Ex: Ana Silva"
                            value={newProfessional.name}
                            onChange={(e) => setNewProfessional({...newProfessional, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="professionalSpecialty">Especialidade</Label>
                          <Input
                            id="professionalSpecialty"
                            placeholder="Ex: Cabelereiro"
                            value={newProfessional.specialty}
                            onChange={(e) => setNewProfessional({...newProfessional, specialty: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="professionalPhone">Telefone</Label>
                          <Input
                            id="professionalPhone"
                            placeholder="(11) 99999-9999"
                            value={newProfessional.phone}
                            onChange={(e) => setNewProfessional({...newProfessional, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <Button 
                        className="mt-4" 
                        onClick={() => {
                          if (newProfessional.name && newProfessional.specialty && newProfessional.phone) {
                            const updatedProfessionals = [...professionals, {
                              id: professionals.length + 1,
                              name: newProfessional.name,
                              specialty: newProfessional.specialty,
                              phone: newProfessional.phone
                            }];
                            setProfessionals(updatedProfessionals);
                            localStorage.setItem(`professionals_${salonId}`, JSON.stringify(updatedProfessionals));
                            setNewProfessional({ name: "", specialty: "", phone: "" });
                            toast({ title: "Profissional adicionado com sucesso!" });
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Profissional
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Lista de profissionais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Equipe Cadastrada</h3>
                    {professionals.map((professional) => (
                      <div key={professional.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{professional.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {professional.specialty} • {professional.phone}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const updatedProfessionals = professionals.filter(p => p.id !== professional.id);
                              setProfessionals(updatedProfessionals);
                              localStorage.setItem(`professionals_${salonId}`, JSON.stringify(updatedProfessionals));
                              toast({ title: "Profissional removido com sucesso!" });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Salão</CardTitle>
                <CardDescription>Configure seu salão e preferências</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="salonName">Nome do Salão</Label>
                        <Input
                          id="salonName"
                          value={salonSettings.name}
                          onChange={(e) => setSalonSettings({...salonSettings, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="salonPhone">Telefone</Label>
                        <Input
                          id="salonPhone"
                          value={salonSettings.phone}
                          onChange={(e) => setSalonSettings({...salonSettings, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="salonEmail">E-mail</Label>
                        <Input
                          id="salonEmail"
                          type="email"
                          value={salonSettings.email}
                          onChange={(e) => setSalonSettings({...salonSettings, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="salonAddress">Endereço</Label>
                        <Textarea
                          id="salonAddress"
                          value={salonSettings.address}
                          onChange={(e) => setSalonSettings({...salonSettings, address: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="workingHours">Horário de Funcionamento</Label>
                        <Textarea
                          id="workingHours"
                          value={salonSettings.workingHours}
                          onChange={(e) => setSalonSettings({...salonSettings, workingHours: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        localStorage.setItem(`salonSettings_${salonId}`, JSON.stringify(salonSettings));
                        toast({ title: "Configurações salvas com sucesso!" });
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;