import React from 'react';

const Test = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black mb-4">Teste de Renderização</h1>
        <p className="text-gray-600">Se você está vendo isso, o React está funcionando!</p>
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <p>Data atual: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Test;