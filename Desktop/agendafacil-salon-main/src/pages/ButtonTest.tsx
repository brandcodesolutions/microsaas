import React, { useState } from 'react';
import { Button } from '../components/ui/button';

const ButtonTest: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [message, setMessage] = useState('');

  const handleSimpleClick = () => {
    console.log('Botão clicado!');
    setClickCount(prev => prev + 1);
    setMessage('Botão funcionando!');
  };

  const handleAlertClick = () => {
    alert('Botão de alerta funcionando!');
  };

  const handleConsoleLog = () => {
    console.log('Console log funcionando - cliques:', clickCount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Botões</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <p className="mb-4">Contador de cliques: {clickCount}</p>
            <p className="mb-4 text-green-600">{message}</p>
          </div>
          
          <div className="space-y-4">
            <Button onClick={handleSimpleClick} className="w-full">
              Botão Simples (Contador: {clickCount})
            </Button>
            
            <Button onClick={handleAlertClick} variant="outline" className="w-full">
              Botão com Alert
            </Button>
            
            <Button onClick={handleConsoleLog} variant="secondary" className="w-full">
              Botão Console Log
            </Button>
            
            <button 
              onClick={() => setMessage('Botão HTML nativo funcionando!')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Botão HTML Nativo
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Instruções:</h3>
            <ul className="text-sm space-y-1">
              <li>• Clique nos botões para testar se estão funcionando</li>
              <li>• Verifique o console do navegador (F12)</li>
              <li>• O contador deve aumentar a cada clique</li>
              <li>• O botão de alert deve mostrar uma mensagem</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonTest;