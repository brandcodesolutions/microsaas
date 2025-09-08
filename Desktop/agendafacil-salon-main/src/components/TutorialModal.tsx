import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Bem-vindo ao AgendaFácil!",
      content: "Seu sistema completo de agendamentos para salões de beleza e barbearias.",
      image: "📱",
      tips: ["Interface intuitiva e fácil de usar", "Acesso rápido a todas as funcionalidades"]
    },
    {
      title: "Gerenciar Agendamentos",
      content: "Visualize, confirme e gerencie todos os seus agendamentos em um só lugar.",
      image: "📅",
      tips: ["Filtre por período e status", "Confirme agendamentos com um clique", "Compartilhe detalhes via WhatsApp"]
    },
    {
      title: "Link Público de Agendamento",
      content: "Compartilhe seu link público para que clientes agendem diretamente.",
      image: "🔗",
      tips: ["Clique em 'Link Público' no header", "Compartilhe nas redes sociais", "Clientes agendam sem cadastro"]
    },
    {
      title: "Controle Financeiro",
      content: "Acompanhe receitas, despesas e o desempenho financeiro do seu negócio.",
      image: "💰",
      tips: ["Receitas automáticas dos agendamentos", "Registre despesas facilmente", "Relatórios detalhados"]
    },
    {
      title: "Configurações do Salão",
      content: "Personalize serviços, horários de funcionamento e informações do salão.",
      image: "⚙️",
      tips: ["Cadastre seus serviços e preços", "Defina horários de funcionamento", "Configure dados do salão"]
    },
    {
      title: "Pronto para começar!",
      content: "Agora você já sabe como usar o AgendaFácil. Comece a gerenciar seus agendamentos!",
      image: "🚀",
      tips: ["Explore todas as funcionalidades", "Personalize conforme sua necessidade", "Sucesso em seu negócio!"]
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Tutorial</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Passo {currentStep + 1} de {tutorialSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">{currentTutorial.image}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {currentTutorial.title}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {currentTutorial.content}
            </p>
            
            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Dicas Rápidas:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {currentTutorial.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            {currentStep === tutorialSteps.length - 1 ? (
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Finalizar
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialModal;