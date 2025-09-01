import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabaseApi } from "@/services/supabase-api";

const Register = () => {
  const [formData, setFormData] = useState({
    salonName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await supabaseApi.auth.signUp(
        formData.email,
        formData.password,
        {
          name: formData.salonName,
          phone: formData.phone,
          address: formData.address,
          description: formData.description
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Erro ao cadastrar');
      }

      toast({
        title: "Salão cadastrado com sucesso!",
        description: "Verifique seu email para confirmar a conta e depois faça login.",
      });

      // Limpar o formulário após cadastro bem-sucedido
      setFormData({
        salonName: '',
        ownerName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        description: ''
      });
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao cadastrar o salão. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">AgendaFácil</span>
          </div>
          <h1 className="text-3xl font-bold">Cadastre seu salão</h1>
          <p className="text-muted-foreground">Comece a receber agendamentos online hoje mesmo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Salão</CardTitle>
            <CardDescription>
              Preencha os dados do seu salão para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salonName">Nome do Salão *</Label>
                  <Input
                    id="salonName"
                    name="salonName"
                    placeholder="Ex: Salão Beleza Total"
                    value={formData.salonName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Nome do Responsável *</Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    placeholder="Seu nome completo"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Salão</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Conte um pouco sobre seu salão, especialidades, diferenciais..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta e Começar"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <div className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;