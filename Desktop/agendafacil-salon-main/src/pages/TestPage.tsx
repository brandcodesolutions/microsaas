import React from 'react';

const TestPage = () => {
  console.log('🧪 TestPage component rendered');
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Página de Teste
        </h1>
        <p className="text-gray-600 mb-4">
          Esta é uma página de teste simples para verificar se o roteamento está funcionando corretamente.
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-green-100 rounded">
            <span className="text-green-800 font-medium">✅ Componente carregado com sucesso</span>
          </div>
          <div className="p-3 bg-blue-100 rounded">
            <span className="text-blue-800 font-medium">🔍 Verifique o console para logs</span>
          </div>
        </div>
        <div className="mt-6">
          <a 
            href="/dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestPage;