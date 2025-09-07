// Script simples para debugar o Storage sem dependências externas
// Execute no console do navegador na página do app

console.log('🔍 Verificando Storage do Supabase...');

// Função para testar URLs diretamente
function testImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ success: true, url });
    img.onerror = () => resolve({ success: false, url, error: 'Failed to load' });
    img.src = url;
  });
}

// URLs para testar
const testUrls = [
  'https://ofpuhlkkvzrxidqkwvyp.supabase.co/storage/v1/object/public/salon-assets/salon-images/32b4dcc5-05b0-4116-9a5b-27c5914d915f_cover.png',
  'https://ofpuhlkkvzrxidqkwvyp.supabase.co/storage/v1/object/public/salon-assets/salon-images/32b4dcc5-05b0-4116-9a5b-27c5914d915f_logo.png'
];

// Testar cada URL
async function runTests() {
  console.log('\n📋 Testando URLs das imagens:');
  
  for (const url of testUrls) {
    console.log(`\n🔗 Testando: ${url}`);
    const result = await testImageUrl(url);
    
    if (result.success) {
      console.log('✅ Imagem carregou com sucesso!');
    } else {
      console.log('❌ Falha ao carregar imagem:', result.error);
      
      // Testar com fetch para mais detalhes
      try {
        const response = await fetch(url);
        console.log(`📊 Status HTTP: ${response.status}`);
        console.log(`📊 Status Text: ${response.statusText}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.log('📄 Resposta do servidor:', text);
        }
      } catch (fetchError) {
        console.log('❌ Erro no fetch:', fetchError.message);
      }
    }
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar os testes
runTests();

// Instruções para o usuário
console.log('\n📝 INSTRUÇÕES:');
console.log('1. Abra o DevTools (F12)');
console.log('2. Vá para a aba Console');
console.log('3. Cole este código e pressione Enter');
console.log('4. Verifique os resultados dos testes');