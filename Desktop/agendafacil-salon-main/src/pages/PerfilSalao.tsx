import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, ExternalLink, Palette, Share2, QrCode, Instagram, MessageCircle, Mail, Clock, MapPin, Phone } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/lib/supabase";

interface SalonData {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  instagram_url: string;
  whatsapp_number: string;
  opening_time: string;
  closing_time: string;
  logo_url?: string;
  cover_image_url?: string;
  theme_color: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  duration_minutes: number;
  image_url?: string;
}

const PerfilSalao = () => {
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [error, setError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    loadSalonData();
  }, []);

  const loadSalonData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load salon data
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (salonError) {
        setError("Erro ao carregar dados do salão");
        return;
      }

      setSalon({
        ...salonData,
        theme_color: salonData.theme_color || '#6366f1'
      });

      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('is_active', true);

      if (servicesData) {
        setServices(servicesData);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    if (type === 'logo') setUploadingLogo(true);
    if (type === 'cover') setUploadingCover(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${salon?.id}_${type}.${fileExt}`;
      const filePath = `salon-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError(`Erro ao fazer upload: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath);

      // Update salon data
      const updateField = type === 'logo' ? 'logo_url' : 'cover_image_url';
      setSalon(prev => prev ? { ...prev, [updateField]: publicUrl } : null);

      // Save to database
      const { error: updateError } = await supabase
        .from('salons')
        .update({ [updateField]: publicUrl })
        .eq('id', salon?.id);

      if (updateError) {
        setError(`Erro ao salvar: ${updateError.message}`);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'cover') setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!salon) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('salons')
        .update({
          name: salon.name,
          description: salon.description,
          address: salon.address,
          phone: salon.phone,
          instagram_url: salon.instagram_url,
          whatsapp_number: salon.whatsapp_number,
          opening_time: salon.opening_time,
          closing_time: salon.closing_time,
          theme_color: salon.theme_color,
          logo_url: salon.logo_url,
          cover_image_url: salon.cover_image_url
        })
        .eq('id', salon.id);

      if (error) {
        setError("Erro ao salvar: " + error.message);
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

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const publicUrl = `${window.location.origin}/agendamento-publico/${salon?.id}`;



  const handleShare = (platform: string) => {
    const text = `Conheça o ${salon?.name}! Agende seu horário:`;
    const url = publicUrl;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing with URL, copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copiado! Cole no Instagram.');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(salon?.name || '')}&body=${encodeURIComponent(text + ' ' + url)}`);
        break;
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

  if (!salon) {
    return (
      <MobileLayout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum salão encontrado. Complete o onboarding primeiro.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Perfil do Salão</h1>
            <p className="text-gray-600">Personalize seu mini site público</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(publicUrl, '_blank')}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Site Público
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
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
            { id: "info", label: "Informações" },
            { id: "design", label: "Design" },
            { id: "services", label: "Serviços" },
            { id: "share", label: "Compartilhar" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Salão</Label>
                    <Input
                      id="name"
                      value={salon.name}
                      onChange={(e) => setSalon(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={salon.phone || ''}
                      onChange={(e) => setSalon(prev => prev ? {...prev, phone: e.target.value} : null)}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={salon.description || ''}
                    onChange={(e) => setSalon(prev => prev ? {...prev, description: e.target.value} : null)}
                    placeholder="Conte sobre seu salão..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={salon.address || ''}
                    onChange={(e) => setSalon(prev => prev ? {...prev, address: e.target.value} : null)}
                    placeholder="Rua, número, bairro, cidade"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="opening_time">Horário de Abertura</Label>
                    <Input
                      id="opening_time"
                      type="time"
                      value={salon.opening_time || ''}
                      onChange={(e) => setSalon(prev => prev ? {...prev, opening_time: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="closing_time">Horário de Fechamento</Label>
                    <Input
                      id="closing_time"
                      type="time"
                      value={salon.closing_time || ''}
                      onChange={(e) => setSalon(prev => prev ? {...prev, closing_time: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={salon.instagram_url || ''}
                      onChange={(e) => setSalon(prev => prev ? {...prev, instagram_url: e.target.value} : null)}
                      placeholder="@seusalao"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={salon.whatsapp_number || ''}
                      onChange={(e) => setSalon(prev => prev ? {...prev, whatsapp_number: e.target.value} : null)}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "design" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalização Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="theme_color">Cor do Tema</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Input
                      id="theme_color"
                      type="color"
                      value={salon.theme_color}
                      onChange={(e) => setSalon(prev => prev ? {...prev, theme_color: e.target.value} : null)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={salon.theme_color}
                      onChange={(e) => setSalon(prev => prev ? {...prev, theme_color: e.target.value} : null)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label>Logo do Salão</Label>
                    <div className="mt-2">
                      {salon.logo_url ? (
                        <div className="relative">
                          <img 
                            src={salon.logo_url} 
                            alt="Logo" 
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingLogo}
                            />
                            <Button variant="secondary" size="sm" disabled={uploadingLogo}>
                              {uploadingLogo ? "Enviando..." : "Alterar"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Clique para adicionar logo</p>
                          <Button variant="outline" size="sm" disabled={uploadingLogo}>
                            {uploadingLogo ? "Enviando..." : "Selecionar Arquivo"}
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingLogo}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Foto de Capa</Label>
                    <div className="mt-2">
                      {salon.cover_image_url ? (
                        <div className="relative">
                          <img 
                            src={salon.cover_image_url} 
                            alt="Capa" 
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingCover}
                            />
                            <Button variant="secondary" size="sm" disabled={uploadingCover}>
                              {uploadingCover ? "Enviando..." : "Alterar"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Foto de fundo do site</p>
                          <Button variant="outline" size="sm" disabled={uploadingCover}>
                            {uploadingCover ? "Enviando..." : "Selecionar Arquivo"}
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingCover}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview do Site Público</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="max-w-sm mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div 
                      className="h-32 bg-gradient-to-r from-primary to-primary/80 relative"
                      style={{ 
                        background: salon.cover_image_url 
                          ? `url(${salon.cover_image_url})` 
                          : `linear-gradient(to right, ${salon.theme_color}, ${salon.theme_color}80)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {salon.cover_image_url && (
                        <div 
                          className="absolute inset-0 bg-gradient-to-r opacity-60"
                          style={{ background: `linear-gradient(to right, ${salon.theme_color}40, ${salon.theme_color}80)` }}
                        ></div>
                      )}
                      {salon.logo_url && (
                        <div className="absolute bottom-4 left-4">
                          <img 
                            src={salon.logo_url} 
                            alt="Logo" 
                            className="w-12 h-12 rounded-full border-2 border-white object-cover bg-white"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{salon.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{salon.description || 'Descrição do salão...'}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        {salon.address && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {salon.address}
                          </div>
                        )}
                        {salon.opening_time && salon.closing_time && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {salon.opening_time} - {salon.closing_time}
                          </div>
                        )}
                        {salon.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {salon.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Catálogo de Serviços</CardTitle>
                <Button size="sm">
                  Adicionar Serviço
                </Button>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum serviço cadastrado</p>
                    <p className="text-sm">Adicione serviços para aparecerem no seu site público</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="secondary">
                            {formatCurrency(service.price_cents)}
                          </Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Duração: {service.duration_minutes} min
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "share" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compartilhar Site Público</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Link Público</Label>
                  <div className="flex mt-2">
                    <Input 
                      value={publicUrl} 
                      readOnly 
                      className="flex-1 bg-gray-50"
                    />
                    <Button 
                      variant="outline" 
                      className="ml-2"
                      onClick={() => navigator.clipboard.writeText(publicUrl)}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('whatsapp')}
                    className="h-12"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('instagram')}
                    className="h-12"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('email')}
                    className="h-12"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    E-mail
                  </Button>
                </div>
                
                <div className="text-center pt-4">
                  <Button variant="outline" className="h-12">
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default PerfilSalao;