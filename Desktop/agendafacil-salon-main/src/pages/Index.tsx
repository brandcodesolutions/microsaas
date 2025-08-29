import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, Smartphone, BarChart3, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">AgendaFácil</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Cadastrar Salão</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6">
          Transforme seu salão com
          <span className="text-primary block">agendamentos online</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Sistema completo de agendamento para salões de beleza e barbearias. 
          Simplifique sua gestão e ofereça praticidade aos seus clientes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Começar Gratuitamente
            </Button>
          </Link>
          <Link to="/demo">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Ver Demonstração
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tudo que seu salão precisa
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Calendar className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Agendamento Online</CardTitle>
              <CardDescription>
                Clientes agendam 24/7 através do seu link exclusivo
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Users className="w-10 h-10 text-secondary mb-2" />
              <CardTitle>Gestão de Profissionais</CardTitle>
              <CardDescription>
                Organize a agenda de cada profissional do seu salão
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Smartphone className="w-10 h-10 text-accent mb-2" />
              <CardTitle>100% Responsivo</CardTitle>
              <CardDescription>
                Funciona perfeitamente em celulares, tablets e computadores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Clock className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Controle de Horários</CardTitle>
              <CardDescription>
                Configure seus horários de funcionamento e disponibilidade
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-secondary mb-2" />
              <CardTitle>Relatórios Completos</CardTitle>
              <CardDescription>
                Acompanhe estatísticas e performance do seu negócio
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <Star className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Fácil de Usar</CardTitle>
              <CardDescription>
                Interface intuitiva que qualquer pessoa consegue usar
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para modernizar seu salão?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de salões que já transformaram sua gestão
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 AgendaFácil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
