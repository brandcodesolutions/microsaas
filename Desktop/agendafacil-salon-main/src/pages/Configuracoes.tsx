import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, LogOut, Smartphone, Mail, Key, Trash2 } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface NotificationSettings {
  email_appointments: boolean;
  email_reminders: boolean;
  sms_appointments: boolean;
  sms_reminders: boolean;
  push_notifications: boolean;
}

const Configuracoes = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_appointments: true,
    email_reminders: true,
    sms_appointments: false,
    sms_reminders: false,
    push_notifications: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        phone: authUser.user_metadata?.phone || ''
      });

      // Load notification preferences (would be from a separate table in real app)
      // For now, using default values
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: user.full_name,
          phone: user.phone
        }
      });

      if (error) {
        setError("Erro ao salvar perfil: " + error.message);
      } else {
        setError("");
        // Show success message
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError("Erro ao alterar senha: " + error.message);
      } else {
        setError("");
        setNewPassword("");
        setConfirmPassword("");
        // Show success message
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      // In a real app, this would be handled by a server function
      alert('Funcionalidade em desenvolvimento. Entre em contato com o suporte.');
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600">Gerencie sua conta e preferências</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: "profile", label: "Perfil", icon: User },
            { id: "notifications", label: "Notificações", icon: Bell },
            { id: "security", label: "Segurança", icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
                </div>
                
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={user?.full_name || ''}
                    onChange={(e) => setUser(prev => prev ? {...prev, full_name: e.target.value} : null)}
                    placeholder="Seu nome completo"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={user?.phone || ''}
                    onChange={(e) => setUser(prev => prev ? {...prev, phone: e.target.value} : null)}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>
                
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações por E-mail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Novos agendamentos</p>
                      <p className="text-sm text-gray-500">Receba e-mail quando houver novos agendamentos</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email_appointments}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, email_appointments: checked}))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Lembretes</p>
                      <p className="text-sm text-gray-500">Receba lembretes de agendamentos próximos</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email_reminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, email_reminders: checked}))
                    }
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notificações por SMS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Novos agendamentos</p>
                      <p className="text-sm text-gray-500">Receba SMS quando houver novos agendamentos</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.sms_appointments}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, sms_appointments: checked}))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Lembretes</p>
                      <p className="text-sm text-gray-500">Receba SMS de lembretes</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.sms_reminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, sms_reminders: checked}))
                    }
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notificações Push</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Notificações no navegador</p>
                      <p className="text-sm text-gray-500">Receba notificações push no navegador</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({...prev, push_notifications: checked}))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isSaving || !newPassword || !confirmPassword}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {isSaving ? "Alterando..." : "Alterar Senha"}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="flex-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </Button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> A exclusão da conta é permanente e não pode ser desfeita. 
                    Todos os seus dados, agendamentos e configurações serão perdidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Configuracoes;