import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Camera, Clock, MapPin, Palette, Scissors, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface OnboardingData {
  salonName: string;
  serviceName: string;
  servicePrice: string;
  serviceDuration: string;
  logo: File | null;
  coverPhoto: File | null;
  openTime: string;
  closeTime: string;
  address: string;
  description: string;
  instagram: string;
  whatsapp: string;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const [data, setData] = useState<OnboardingData>({
    salonName: "",
    serviceName: "",
    servicePrice: "",
    serviceDuration: "60",
    logo: null,
    coverPhoto: null,
    openTime: "09:00",
    closeTime: "18:00",
    address: "",
    description: "",
    instagram: "",
    whatsapp: ""
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Usuário não encontrado");
        return;
      }

      // Criar o salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .insert({
          name: data.salonName,
          slug: data.salonName.toLowerCase().replace(/\s+/g, '-'),
          owner_id: user.id,
          address: data.address,
          description: data.description,
          instagram_url: data.instagram,
          whatsapp_number: data.whatsapp,
          opening_time: data.openTime,
          closing_time: data.closeTime,
          is_active: true
        })
        .select()
        .single();

      if (salonError) {
        setError("Erro ao criar salão: " + salonError.message);
        return;
      }

      // Criar o primeiro serviço
      const { error: serviceError } = await supabase
        .from('services')
        .insert({
          salon_id: salonData.id,
          name: data.serviceName,
          price_cents: parseInt(data.servicePrice) * 100,
          duration_minutes: parseInt(data.serviceDuration),
          is_active: true
        });

      if (serviceError) {
        setError("Erro ao criar serviço: " + serviceError.message);
        return;
      }

      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || "Erro ao finalizar configuração");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (field: 'logo' | 'coverPhoto', file: File | null) => {
    setData(prev => ({ ...prev, [field]: file }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Scissors className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Bem-vindo!</h2>
              <p className="text-gray-600">Vamos configurar seu salão em poucos passos</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="salonName" className="text-lg">Qual o nome do seu salão?</Label>
                <Input
                  id="salonName"
                  type="text"
                  placeholder="Ex: Salão Beleza & Estilo"
                  value={data.salonName}
                  onChange={(e) => setData(prev => ({ ...prev, salonName: e.target.value }))}
                  className="mt-2 h-12 text-lg"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Scissors className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Primeiro Serviço</h2>
              <p className="text-gray-600">Cadastre seu primeiro serviço</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceName" className="text-lg">Nome do serviço</Label>
                <Input
                  id="serviceName"
                  type="text"
                  placeholder="Ex: Corte feminino"
                  value={data.serviceName}
                  onChange={(e) => setData(prev => ({ ...prev, serviceName: e.target.value }))}
                  className="mt-2 h-12 text-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="servicePrice" className="text-lg">Preço (R$)</Label>
                  <Input
                    id="servicePrice"
                    type="number"
                    placeholder="50"
                    value={data.servicePrice}
                    onChange={(e) => setData(prev => ({ ...prev, servicePrice: e.target.value }))}
                    className="mt-2 h-12 text-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="serviceDuration" className="text-lg">Duração (min)</Label>
                  <Input
                    id="serviceDuration"
                    type="number"
                    placeholder="60"
                    value={data.serviceDuration}
                    onChange={(e) => setData(prev => ({ ...prev, serviceDuration: e.target.value }))}
                    className="mt-2 h-12 text-lg"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Logo do Salão</h2>
              <p className="text-gray-600">Adicione a logo do seu salão (opcional)</p>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Clique para selecionar ou arraste a imagem</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="h-12"
                >
                  Selecionar Logo
                </Button>
                {data.logo && (
                  <p className="text-sm text-green-600 mt-2">✓ {data.logo.name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Palette className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Foto de Capa</h2>
              <p className="text-gray-600">Adicione uma foto de capa (opcional)</p>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Foto que aparecerá no seu perfil público</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('coverPhoto', e.target.files?.[0] || null)}
                  className="hidden"
                  id="cover-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  className="h-12"
                >
                  Selecionar Foto
                </Button>
                {data.coverPhoto && (
                  <p className="text-sm text-green-600 mt-2">✓ {data.coverPhoto.name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Horário de Funcionamento</h2>
              <p className="text-gray-600">Defina o horário de atendimento</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openTime" className="text-lg">Abertura</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={data.openTime}
                    onChange={(e) => setData(prev => ({ ...prev, openTime: e.target.value }))}
                    className="mt-2 h-12 text-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="closeTime" className="text-lg">Fechamento</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={data.closeTime}
                    onChange={(e) => setData(prev => ({ ...prev, closeTime: e.target.value }))}
                    className="mt-2 h-12 text-lg"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Informações Finais</h2>
              <p className="text-gray-600">Complete seu perfil</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address" className="text-lg">Endereço</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Rua, número, bairro, cidade"
                  value={data.address}
                  onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-2 h-12 text-lg"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-lg">Descrição do salão</Label>
                <Textarea
                  id="description"
                  placeholder="Conte um pouco sobre seu salão..."
                  value={data.description}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram" className="text-lg">Instagram</Label>
                  <Input
                    id="instagram"
                    type="text"
                    placeholder="@seusalao"
                    value={data.instagram}
                    onChange={(e) => setData(prev => ({ ...prev, instagram: e.target.value }))}
                    className="mt-2 h-12 text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="text-lg">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={data.whatsapp}
                    onChange={(e) => setData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="mt-2 h-12 text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.salonName.trim() !== "";
      case 2:
        return data.serviceName.trim() !== "" && data.servicePrice.trim() !== "" && data.serviceDuration.trim() !== "";
      case 3:
      case 4:
        return true; // Opcionais
      case 5:
        return data.openTime !== "" && data.closeTime !== "";
      case 6:
        return true; // Campos opcionais
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="container mx-auto max-w-md py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Passo {currentStep} de {totalSteps}</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="h-12 px-6"
              >
                Voltar
              </Button>
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="h-12 px-6"
              >
                {isLoading ? "Finalizando..." : currentStep === totalSteps ? "Finalizar" : "Próximo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;