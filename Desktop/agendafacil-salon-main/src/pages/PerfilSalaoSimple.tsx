import React from 'react';

const PerfilSalaoSimple = () => {
  console.log('🏪 PerfilSalaoSimple component rendered');
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🏪 Perfil do Salão (Versão Simples)
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Informações Básicas</h2>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-gray-600">Nome: Salão Teste</p>
                <p className="text-gray-600">Email: teste@salao.com</p>
                <p className="text-gray-600">Telefone: (11) 99999-9999</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Status</h2>
              <div className="p-4 bg-green-50 rounded">
                <span className="text-green-800 font-medium">✅ Componente carregado com sucesso</span>
              </div>
              <div className="p-4 bg-blue-50 rounded">
                <span className="text-blue-800 font-medium">🔍 Sem integração com Supabase</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex space-x-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors">
              Botão Teste 1
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors">
              Botão Teste 2
            </button>
            <a 
              href="/dashboard" 
              className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Voltar ao Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilSalaoSimple;